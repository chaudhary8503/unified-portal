import './PlaceholderCard.css';

interface PlaceholderCardProps {
  title: string;
  description: string;
}

/** "Coming soon" page body for modules that haven't been built yet. */
function PlaceholderCard({ title, description }: PlaceholderCardProps) {
  return (
    <div className="card placeholder-card">
      <span className="placeholder-badge">Coming soon</span>
      <h1 className="page-title">{title}</h1>
      <p className="page-sub">{description}</p>
    </div>
  );
}

export default PlaceholderCard;
