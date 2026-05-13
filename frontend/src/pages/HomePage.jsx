import { useNavigate } from "react-router-dom";
import { useInView } from "../hooks/useInView";
import "./HomePage.css";
import bannerimage from "../assets/kanbanimage.svg";
import cardimage from "../assets/cardimage.png";
import cardimage2 from "../assets/cardimage2.png";
import cardimage3 from "../assets/cardimage3.png";

function HomePage() {
    const navigate = useNavigate();

    function handleStartTracking() {
        const token = localStorage.getItem("token");
        if (token) {
            navigate("/dashboard");
        } else {
            navigate("/login");
        }
    }

    const tickerItems = [
        "Track Applications", "Stay Organised", "Land Your Dream Job",
        "Never Miss a Deadline", "Apply Smarter", "Track Applications",
        "Stay Organised", "Land Your Dream Job", "Never Miss a Deadline", "Apply Smarter",
    ];

    const Banner = () => {
        return (
            <div className="banner-container">
                <div className="banner-content">
                    <p className="banner-eyebrow">Your job search, simplified</p>
                    <h1>
                        Apply.<br />
                        Track.<br />
                        <span className="accent">Get Hired.</span>
                    </h1>
                    <p className="banner-subtitle">
                        Stop losing track of applications in spreadsheets. JobTracker keeps everything organised so you can focus on what matters - landing the job.
                    </p>
                    <div className="banner-actions">
                        <button className="primary-btn" onClick={handleStartTracking}>
                            Start tracking
                        </button>
                    </div>
                </div>
                <div className="banner-image-wrapper">
                    <div className="banner-image-glow" />
                    <img src={bannerimage} className="banner-image" alt="Example of Job Tracker App" />
                </div>
            </div>
        );
    };

    const Ticker = () => (
        <div className="ticker-section">
            <div className="ticker-track">
                {tickerItems.map((item, i) => (
                    <span key={i} className="ticker-item">
                        {item} <span className="ticker-dot">✦</span>
                    </span>
                ))}
                {tickerItems.map((item, i) => (
                    <span key={`b-${i}`} className="ticker-item">
                        {item} <span className="ticker-dot">✦</span>
                    </span>
                ))}
            </div>
        </div>
    );

    const HowItWorks = () => {
        const [ref, inView] = useInView();
        return (
            <div ref={ref} className={`how-it-works fade-in ${inView ? "visible" : ""}`}>
                <p className="section-label">How it works</p>
                <h2 className="section-heading">Three steps to a better job search</h2>
                <div className="steps-grid">
                    <div className="step-card">
                        <div className="step-number">01</div>
                        <h3 className="step-title">Add your application</h3>
                        <p className="step-desc">Paste a job URL or fill in the details. We'll keep it all in one place for you.</p>
                    </div>
                    <div className="step-card">
                        <div className="step-number">02</div>
                        <h3 className="step-title">Track your progress</h3>
                        <p className="step-desc">Move applications through stages - Applied, Interviewing, Offer - with a visual kanban board.</p>
                    </div>
                    <div className="step-card">
                        <div className="step-number">03</div>
                        <h3 className="step-title">Stay on top of it all</h3>
                        <p className="step-desc">Add notes, contacts, and follow-ups so nothing slips through the cracks.</p>
                    </div>
                </div>
            </div>
        );
    };

    const StatsBar = () => {
        const [ref, inView] = useInView();
        return (
            <div ref={ref} className={`stats-bar fade-in ${inView ? "visible" : ""}`}>
                <div className="stat-item">
                    <div className="stat-number">100%</div>
                    <div className="stat-label">Free, forever</div>
                </div>
                <div className="stat-item">
                    <div className="stat-number">3 min</div>
                    <div className="stat-label">To get started</div>
                </div>
                <div className="stat-item">
                    <div className="stat-number">∞</div>
                    <div className="stat-label">Applications to track</div>
                </div>
                <div className="stat-item">
                    <div className="stat-number">1</div>
                    <div className="stat-label">Place for everything</div>
                </div>
            </div>
        );
    };

    const Description = () => {
        const [ref, inView] = useInView();
        return (
            <div ref={ref} className={`description-container fade-in ${inView ? "visible" : ""}`}>
                <div className="card">
                    <div className="card-icon">
                        <i className="ti ti-briefcase"></i>
                    </div>
                    <h3 className="card-heading">Track Every Application</h3>
                    <p className="card-description">
                        Keep all your job applications organised in one place. Monitor roles, companies, deadlines, and progress without losing track.
                    </p>
                </div>
                <div className="card">
                    <div className="card-icon">
                            <i className="ti ti-clock"></i>
                    </div>
                    <h3 className="card-heading">Never Miss a Step</h3>
                    <p className="card-description">
                        Easily see where each application stands, from applied to interview to offer, so you always know what to do next.
                    </p>
                </div>
                <div className="card">
                        <div className="card-icon">
                            <i className="ti ti-mood-smile"></i>
                        </div>
                    <h3 className="card-heading">Stay Organised, Stay Confident</h3>
                    <p className="card-description">
                        Take the guesswork out of job hunting. Stay focused, reduce overwhelm, and approach your applications with clarity.
                    </p>
                </div>
            </div>
        );
    };

    const Testimonials = () => {
        const [ref, inView] = useInView();
        const testimonials = [
            {
                quote: "I used to track everything in a messy spreadsheet. JobTracker changed how I approach my search. I actually feel in control now.",
                name: "Sarah K.",
                role: "UX Designer",
                initials: "SK",
            },
            {
                quote: "The kanban board is a game changer. Being able to see all my applications at a glance keeps me motivated and organised.",
                name: "James T.",
                role: "Software Engineer",
                initials: "JT",
            },
            {
                quote: "I landed my job within 6 weeks of using JobTracker. Having everything in one place made follow-ups so much easier.",
                name: "Mia L.",
                role: "Product Manager",
                initials: "ML",
            },
        ];

        return (
            <div ref={ref} className={`testimonials fade-in ${inView ? "visible" : ""}`}>
                <p className="section-label">What people say</p>
                <h2 className="section-heading">Real stories from real job seekers</h2>
                <div className="testimonials-grid">
                    {testimonials.map((t, i) => (
                        <div className="testimonial-card" key={i}>
                            <p className="testimonial-quote">{t.quote}</p>
                            <div className="testimonial-author">
                                <div className="testimonial-avatar">{t.initials}</div>
                                <div>
                                    <div className="testimonial-name">{t.name}</div>
                                    <div className="testimonial-role">{t.role}</div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    const FinalBanner = () => {
        const [ref, inView] = useInView();
        return (
            <div ref={ref} className={`final-banner fade-in ${inView ? "visible" : ""}`}>
                <h2>Ready to take control of your job search?</h2>
                <p>Join job seekers like you and track smarter, not harder.</p>
                <button className="final-btn" onClick={handleStartTracking}>
                    Get started for free
                </button>
            </div>
        );
    };

    return (
        <div className="home-page">
            <Banner />
            <Ticker />
            <HowItWorks />
            <StatsBar />
            <Description />
            <Testimonials />
            <FinalBanner />
        </div>
    );
}

export default HomePage;