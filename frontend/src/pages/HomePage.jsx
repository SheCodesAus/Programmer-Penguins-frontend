import { useNavigate } from "react-router-dom";
import { useInView } from "../hooks/useInView";
import "./HomePage.css";
import bannerimage from "../assets/bannerimage.svg";
import cardimage from "../assets/cardimage.png";
import cardimage2 from "../assets/cardimage2.png";
import cardimage3 from "../assets/cardimage3.png";

function HomePage() {

    const Banner = () => {
        return (
            <div className="banner-container">
                <div className="banner-content">
                    <h1>
                    Your new <span style={{ color: 'var(--primary)', fontWeight: 'bold' }}>best friend</span> 
                    <br></br>for<span style={{ fontWeight: 'bold' }}> job applications.</span>
                    </h1>
                    <button className="primary-btn" onClick={() => navigate("/login")}>
                        Start tracking
                    </button>
                </div>
                <div>
                    <img src={bannerimage} className="banner-image" alt="Example of Job Buddy App" />
                </div>
            </div>
        );
    };

    const Description = () => {
        const [ref, inView] = useInView();
        return (
            <div ref={ref} className={`description-container fade-in ${inView ? "visible" : ""}`}>
            <div className="description-container">
                <div className="card">
                    <img src={cardimage} alt="Description Image" className="card-image" />
                        <h2 className="card-title">Track Every Application</h2>
                        <p className="card-description">
                        Keep all your job applications organised in one place. Monitor roles, companies, deadlines, and progress without losing track.
                        </p>
                </div>
                <div className="card">
                    <img src={cardimage2} alt="Description Image" className="card-image" />
                        <h2 className="card-title">Never Miss a Step</h2>
                        <p className="card-description">
                        Easily see where each application stands, from applied to interview to offer, so you always know what to do next.
                        </p>
                </div>
                <div className="card">
                    <img src={cardimage3} alt="Description Image" className="card-image" />
                    <h2 className="card-title">Stay Organised, <br></br>Stay Confident</h2>
                    <p className="card-description">
                    Take the guesswork out of job hunting. Stay focused, reduce overwhelm, and approach your applications with clarity.
                    </p>
                </div>
            </div>
            </div>
        );
    };

    return (
        <div>
            <Banner />
            <Description />
        </div>
    );
};

export default HomePage;