import { useNavigate } from "react-router-dom";
import "./JobApplicationPage.css";
import companylogo from "../assets/company-logo.png";
import progressbar from "../assets/demo-progressbar.png";

function JobApplicationPage() {
    const navigate = useNavigate();

    return (
        <div className="page-container">
            <div className="top-buttons">
                <button className="secondary-btn" onClick={() => navigate("/dashboard")}>
                    ◀   Return to dashboard
                </button>
                <button className="secondary-btn" onClick={() => navigate("/")}>
                    Edit
                </button>
            </div>
            <img src={progressbar} alt="progress bar" className="progressbar" />
            <div className="job-description">
                <img src={companylogo} alt="Company Logo" className="company-logo" />
                <div className="job-details">
                    <h4 className="heading-column"><span style={{ fontWeight: 'bold' }}>Job title:</span></h4>
                    <h4 className="answer-column"><span style={{ fontWeight: 'normal' }}>Occupational Therapist</span></h4>
                    <h4 className="heading-column"><span style={{ fontWeight: 'bold' }}>Company Name:</span></h4>
                    <h4 className="answer-column"><span style={{ fontWeight: 'normal' }}>NSWHealth</span></h4> 
                    <h4 className="heading-column"><span style={{ fontWeight: 'bold' }}>Location:</span></h4>
                    <h4 className="answer-column"><span style={{ fontWeight: 'normal' }}>RPA Hospital</span></h4> 
                    <h4 className="heading-column"><span style={{ fontWeight: 'bold' }}>Date Posted:</span></h4>
                    <h4 className="answer-column"><span style={{ fontWeight: 'normal' }}>DD/MM/YYYY</span></h4> 
                    <h4 className="heading-column"><span style={{ fontWeight: 'bold' }}>Date Closing:</span></h4>
                    <h4 className="answer-column"><span style={{ fontWeight: 'normal' }}>DD/MM/YYYY</span></h4> 
                    <h4 className="heading-column"><span style={{ fontWeight: 'bold' }}>Salary:</span></h4>
                    <h4 className="answer-column"><span style={{ fontWeight: 'normal' }}>$Min-$Max</span></h4> 
                    <h4 className="heading-column"><span style={{ fontWeight: 'bold' }}>Source:</span></h4>
                    <h4 className="answer-column"><span style={{ fontWeight: 'normal' }}>Seek</span></h4> 
                    <button className="source-btn" onClick={() => navigate("/")}>
                    Link to Advertisement
                    </button>
                </div>
            </div>
        </div>
    );
};

export default JobApplicationPage;