import './LaunchCard.css';

interface LaunchCardProps {
  title: string;
  description: string;
  url: string;
  buttonLabel: string;
}

/** Page body for modules deployed as their own app — links out in a new tab. */
function LaunchCard({ title, description, url, buttonLabel }: LaunchCardProps) {
  return (
    <div className="card launch-card">
      <h1 className="page-title">{title}</h1>
      <p className="page-sub">{description}</p>
      <a className="launch-button" href={url} target="_blank" rel="noopener noreferrer">
        {buttonLabel} ↗
      </a>
    </div>
  );
}

export default LaunchCard;
