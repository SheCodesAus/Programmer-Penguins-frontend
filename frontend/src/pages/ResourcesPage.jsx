import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  BookOpen,
  ChevronDown,
  ChevronUp,
  Link as LinkIcon,
  MessageSquare,
  Search,
  Trash2,
  Upload,
  WandSparkles,
} from "lucide-react";
import {
  createResource,
  deleteResource,
  fetchResources,
  parseChatgptSharedUrl,
  parseResourceUrl,
} from "../api/resources";
import LoadingState from "../components/common/LoadingState";
import "./ResourcesPage.css";

const EMPTY_ARTICLE_FORM = {
  url: "",
  title: "",
  source_name: "",
  author: "",
  published_at: "",
  notes: "",
};

const EMPTY_CHATGPT_FORM = {
  url: "",
  title: "",
  question: "",
  answer: "",
  notes: "",
};

const RESOURCE_FILTERS = [
  { value: "all", label: "All" },
  { value: "ARTICLE", label: "Articles" },
  { value: "CHATGPT", label: "ChatGPT answers" },
];

const COLLAPSIBLE_TEXT_LIMIT = 220;

function extractUrl(value) {
  const match = value.match(/https?:\/\/[^\s"'<>]+/i);
  return match ? match[0] : "";
}

function formatDate(value) {
  if (!value) return "No date";

  return new Date(value).toLocaleDateString("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getResourceSource(resource) {
  return resource.source_name || (resource.resource_type === "CHATGPT" ? "ChatGPT" : "Unknown source");
}

function hasLongResourceContent(resource) {
  return [resource.question, resource.answer, resource.notes]
    .filter(Boolean)
    .some((value) => value.length > COLLAPSIBLE_TEXT_LIMIT || value.includes("\n"));
}

export default function ResourcesPage() {
  const navigate = useNavigate();

  const [resources, setResources] = useState([]);
  const [articleForm, setArticleForm] = useState(EMPTY_ARTICLE_FORM);
  const [chatgptForm, setChatgptForm] = useState(EMPTY_CHATGPT_FORM);
  const [filter, setFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [parsing, setParsing] = useState(false);
  const [parsingChatgpt, setParsingChatgpt] = useState(false);
  const [savingArticle, setSavingArticle] = useState(false);
  const [savingChatgpt, setSavingChatgpt] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [expandedResourceIds, setExpandedResourceIds] = useState(() => new Set());
  const [error, setError] = useState("");

  async function loadResources() {
    try {
      setLoading(true);
      setError("");
      const data = await fetchResources();
      setResources(data);
    } catch (err) {
      setError(err.message || "Could not load resources.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timerId = window.setTimeout(() => {
      loadResources();
    }, 0);

    return () => window.clearTimeout(timerId);
  }, []);

  const filteredResources = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return resources.filter((resource) => {
      const matchesFilter = filter === "all" || resource.resource_type === filter;

      if (!matchesFilter) return false;
      if (!query) return true;

      return [
        resource.title,
        resource.source_name,
        resource.author,
        resource.url,
        resource.question,
        resource.answer,
        resource.notes,
      ]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(query));
    });
  }, [filter, resources, searchQuery]);

  function handleArticleChange(event) {
    const { name, value } = event.target;
    setArticleForm((prev) => ({ ...prev, [name]: value }));
    setError("");
  }

  function handleChatgptChange(event) {
    const { name, value } = event.target;
    setChatgptForm((prev) => ({ ...prev, [name]: value }));
    setError("");
  }

  async function handleParseUrl(urlValue = articleForm.url) {
    const url = extractUrl(urlValue) || urlValue.trim();

    if (!url) {
      setError("Please paste or drop an article URL.");
      return;
    }

    try {
      setParsing(true);
      setError("");
      const metadata = await parseResourceUrl(url);
      setArticleForm((prev) => ({
        ...prev,
        ...metadata,
        published_at: metadata.published_at || "",
        url: metadata.url || url,
      }));
    } catch (err) {
      setArticleForm((prev) => ({ ...prev, url }));
      setError(err.message || "Could not read metadata from this URL. You can fill the fields manually.");
    } finally {
      setParsing(false);
    }
  }

  async function handleParseChatgptUrl(urlValue = chatgptForm.url) {
    const url = extractUrl(urlValue) || urlValue.trim();

    if (!url) {
      setError("Please paste a public ChatGPT shared link.");
      return;
    }

    try {
      setParsingChatgpt(true);
      setError("");
      const metadata = await parseChatgptSharedUrl(url);
      setChatgptForm((prev) => ({
        ...prev,
        ...metadata,
        url: metadata.url || url,
      }));
    } catch (err) {
      setChatgptForm((prev) => ({ ...prev, url }));
      setError(err.message || "Could not read this ChatGPT shared link. You can paste the answer manually.");
    } finally {
      setParsingChatgpt(false);
    }
  }

  async function handleDrop(event) {
    event.preventDefault();
    setIsDragging(false);

    const droppedText =
      event.dataTransfer.getData("text/uri-list") ||
      event.dataTransfer.getData("text/plain");
    const url = extractUrl(droppedText);

    if (!url) {
      setError("Drop a valid article URL.");
      return;
    }

    setArticleForm((prev) => ({ ...prev, url }));
    await handleParseUrl(url);
  }

  async function handleSaveArticle(event) {
    event.preventDefault();

    const url = articleForm.url.trim();

    if (!url) {
      setError("Article URL is required.");
      return;
    }

    try {
      setSavingArticle(true);
      setError("");
      const created = await createResource({
        resource_type: "ARTICLE",
        ...articleForm,
        url,
        title: articleForm.title.trim() || url,
        source_name: articleForm.source_name.trim(),
        author: articleForm.author.trim(),
        published_at: articleForm.published_at || null,
        notes: articleForm.notes.trim(),
      });
      setResources((prev) => [created, ...prev]);
      setArticleForm(EMPTY_ARTICLE_FORM);
    } catch (err) {
      setError(err.message || "Could not save article resource.");
    } finally {
      setSavingArticle(false);
    }
  }

  async function handleSaveChatgpt(event) {
    event.preventDefault();

    if (!chatgptForm.answer.trim()) {
      setError("Paste the ChatGPT answer before saving.");
      return;
    }

    const fallbackTitle = chatgptForm.question.trim().slice(0, 90) || "ChatGPT answer";

    try {
      setSavingChatgpt(true);
      setError("");
      const created = await createResource({
        resource_type: "CHATGPT",
        title: chatgptForm.title.trim() || fallbackTitle,
        source_name: "ChatGPT",
        url: chatgptForm.url.trim(),
        question: chatgptForm.question.trim(),
        answer: chatgptForm.answer.trim(),
        notes: chatgptForm.notes.trim(),
      });
      setResources((prev) => [created, ...prev]);
      setChatgptForm(EMPTY_CHATGPT_FORM);
    } catch (err) {
      setError(err.message || "Could not save ChatGPT answer.");
    } finally {
      setSavingChatgpt(false);
    }
  }

  async function handleDelete(resource) {
    if (!confirm(`Delete "${resource.title}"?`)) return;

    try {
      setError("");
      await deleteResource(resource.id);
      setResources((prev) => prev.filter((item) => item.id !== resource.id));
    } catch (err) {
      setError(err.message || "Could not delete resource.");
    }
  }

  function toggleResourceExpanded(resourceId) {
    setExpandedResourceIds((prev) => {
      const next = new Set(prev);

      if (next.has(resourceId)) {
        next.delete(resourceId);
      } else {
        next.add(resourceId);
      }

      return next;
    });
  }

  return (
    <main className="resources-page">
      <header className="resources-page__header">
        <button
          className="secondary-btn"
          type="button"
          onClick={() => navigate("/dashboard")}
        >
          ◀ Return to dashboard
        </button>

        <div>
          <h1>Resources</h1>
          <p>Save useful articles, references, and ChatGPT answers in one place.</p>
        </div>
      </header>

      <section className="resources-create-grid">
        <form className="resources-panel" onSubmit={handleSaveArticle}>
          <div className="resources-panel__header">
            <LinkIcon size={20} />
            <div>
              <h2>Add article link</h2>
              <p>Paste or drag a URL. You can edit the parsed details before saving.</p>
            </div>
          </div>

          <div
            className={`resources-dropzone ${isDragging ? "resources-dropzone--active" : ""}`}
            onDragOver={(event) => {
              event.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
          >
            <Upload size={22} />
            <span>Drop an article URL here</span>
          </div>

          <div className="resources-url-row">
            <input
              name="url"
              value={articleForm.url}
              onChange={handleArticleChange}
              placeholder="https://example.com/article"
            />
            <button
              className="secondary-btn resources-autofill-btn"
              type="button"
              onClick={() => handleParseUrl()}
              disabled={parsing}
            >
              <WandSparkles size={14} className="spin" />
              {parsing ? "Reading..." : "Fetch details"}
            </button>
          </div>

          <div className="resources-form-grid">
            <label>
              Title
              <input name="title" value={articleForm.title} onChange={handleArticleChange} />
            </label>
            <label>
              Source
              <input name="source_name" value={articleForm.source_name} onChange={handleArticleChange} />
            </label>
            <label>
              Author
              <input name="author" value={articleForm.author} onChange={handleArticleChange} />
            </label>
            <label>
              Publication date
              <input
                type="date"
                name="published_at"
                value={articleForm.published_at}
                onChange={handleArticleChange}
              />
            </label>
          </div>

          <label className="resources-full-field">
            Notes
            <textarea name="notes" value={articleForm.notes} onChange={handleArticleChange} />
          </label>

          <button className="primary-btn" type="submit" disabled={savingArticle}>
            {savingArticle ? "Saving..." : "Save article"}
          </button>
        </form>

        <form className="resources-panel" onSubmit={handleSaveChatgpt}>
          <div className="resources-panel__header">
            <MessageSquare size={20} />
            <div>
              <h2>Save ChatGPT answer</h2>
              <p>Paste a public shared link, or save the question and answer manually.</p>
            </div>
          </div>

          <div className="resources-url-row">
            <input
              name="url"
              value={chatgptForm.url}
              onChange={handleChatgptChange}
              placeholder="https://chatgpt.com/share/..."
            />
            <button
              className="secondary-btn resources-autofill-btn"
              type="button"
              onClick={() => handleParseChatgptUrl()}
              disabled={parsingChatgpt}
            >
              <WandSparkles size={14} className="spin" />
              {parsingChatgpt ? "Reading..." : "Read shared chat"}
            </button>
          </div>

          <label>
            Title
            <input
              name="title"
              value={chatgptForm.title}
              onChange={handleChatgptChange}
              placeholder="e.g. Resume bullet improvements"
            />
          </label>
          <label>
            Question
            <textarea
              name="question"
              value={chatgptForm.question}
              onChange={handleChatgptChange}
              placeholder="What did you ask?"
            />
          </label>
          <label>
            Answer
            <textarea
              name="answer"
              value={chatgptForm.answer}
              onChange={handleChatgptChange}
              placeholder="Paste the useful answer here"
            />
          </label>
          <label>
            Notes
            <textarea name="notes" value={chatgptForm.notes} onChange={handleChatgptChange} />
          </label>

          <button className="primary-btn" type="submit" disabled={savingChatgpt}>
            {savingChatgpt ? "Saving..." : "Save answer"}
          </button>
        </form>
      </section>

      {error && <p className="resources-page__error">{error}</p>}
      {loading && <LoadingState />}

      <section className="resources-toolbar">
        <label className="resources-search">
          <Search size={18} />
          <input
            type="search"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search resources..."
          />
        </label>

        <div className="resources-filters" aria-label="Resource filters">
          {RESOURCE_FILTERS.map((item) => (
            <button
              key={item.value}
              type="button"
              className={filter === item.value ? "active" : ""}
              onClick={() => setFilter(item.value)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </section>

      {!loading && (
        <section className="resources-list" aria-label="Saved resources">
          <div className="resources-list__header">
            <h2>Saved resources</h2>
            <span>{filteredResources.length} items</span>
          </div>

          {filteredResources.length === 0 ? (
            <p className="resources-page__message">No resources saved yet.</p>
          ) : (
            <div className="resources-cards">
              {filteredResources.map((resource) => {
                const isChatgpt = resource.resource_type === "CHATGPT";
                const isExpanded = expandedResourceIds.has(resource.id);
                const canExpand = hasLongResourceContent(resource);
                const cardClassName = `resource-card ${isExpanded ? "resource-card--expanded" : ""}`;

                return (
                  <article className={cardClassName} key={resource.id}>
                    <div className="resource-card__icon" aria-hidden="true">
                      {isChatgpt ? <MessageSquare size={20} /> : <BookOpen size={20} />}
                    </div>

                    <div className="resource-card__body">
                      <div className="resource-card__header">
                        <div>
                          <span>{resource.resource_type_display}</span>
                          <h3>{resource.title}</h3>
                        </div>
                        <button
                          className="resource-card__delete"
                          type="button"
                          onClick={() => handleDelete(resource)}
                          aria-label={`Delete ${resource.title}`}
                          title="Delete"
                        >
                          <Trash2 size={17} />
                        </button>
                      </div>

                      <dl className="resource-card__meta">
                        <div>
                          <dt>Source</dt>
                          <dd>{getResourceSource(resource)}</dd>
                        </div>
                        {!isChatgpt && (
                          <>
                            <div>
                              <dt>Author</dt>
                              <dd>{resource.author || "Unknown"}</dd>
                            </div>
                            <div>
                              <dt>Date</dt>
                              <dd>{formatDate(resource.published_at)}</dd>
                            </div>
                          </>
                        )}
                      </dl>

                      {resource.url && (
                        <a className="resource-card__link" href={resource.url} target="_blank" rel="noreferrer">
                          {isChatgpt ? "Open shared chat" : "Open article"}
                        </a>
                      )}

                      {isChatgpt && resource.question && (
                        <div className="resource-card__text">
                          <span>Question</span>
                          <p>{resource.question}</p>
                        </div>
                      )}
                      {isChatgpt && resource.answer && (
                        <div className="resource-card__text">
                          <span>Answer</span>
                          <p>{resource.answer}</p>
                        </div>
                      )}
                      {resource.notes && (
                        <div className="resource-card__text">
                          <span>Notes</span>
                          <p>{resource.notes}</p>
                        </div>
                      )}

                      {canExpand && (
                        <button
                          className="resource-card__expand"
                          type="button"
                          onClick={() => toggleResourceExpanded(resource.id)}
                          aria-expanded={isExpanded}
                        >
                          {isExpanded ? (
                            <>
                              Show less <ChevronUp size={16} />
                            </>
                          ) : (
                            <>
                              Read more <ChevronDown size={16} />
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      )}
    </main>
  );
}
