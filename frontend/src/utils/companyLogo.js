const JOB_BOARD_DOMAINS = [
  "seek.com",
  "linkedin.com",
  "indeed.com",
  "glassdoor.com",
  "jora.com",
  "adzuna.com",
  "workdayjobs.com",
  "myworkdayjobs.com",
  "greenhouse.io",
  "lever.co",
  "smartrecruiters.com",
  "ashbyhq.com",
  "bamboohr.com",
  "icims.com",
  "jobvite.com",
];

function getHostname(url) {
  if (!url) return "";

  try {
    const normalisedUrl = /^[a-z][a-z0-9+.-]*:\/\//i.test(url)
      ? url
      : `https://${url}`;

    return new URL(normalisedUrl).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return "";
  }
}

function isJobBoardDomain(hostname) {
  return JOB_BOARD_DOMAINS.some(
    (domain) => hostname === domain || hostname.endsWith(`.${domain}`),
  );
}

function getFaviconUrl(domain) {
  if (!domain) return null;
  return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
}

function guessCompanyDomain(companyName = "") {
  const slug = companyName
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(
      /\b(pty|ltd|limited|inc|llc|co|company|corp|corporation|plc|group)\b/g,
      "",
    )
    .replace(/[^a-z0-9]/g, "");

  return slug ? `${slug}.com` : "";
}

export function getCompanyLogoUrl(application) {
  const logoUrl = application?.company_logo_url || application?.logo_url;

  if (logoUrl?.startsWith("http")) {
    return logoUrl;
  }

  const companyWebsite = getHostname(
    application?.company_website ||
      application?.company_url ||
      application?.website,
  );

  if (companyWebsite) {
    return getFaviconUrl(companyWebsite);
  }

  const jobUrlHostname = getHostname(application?.job_url);

  if (jobUrlHostname && !isJobBoardDomain(jobUrlHostname)) {
    return getFaviconUrl(jobUrlHostname);
  }

  return getFaviconUrl(guessCompanyDomain(application?.company_name));
}

export function getCompanyInitials(companyName = "") {
  return (
    companyName
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((word) => word[0])
      .join("")
      .toUpperCase() || "?"
  );
}
