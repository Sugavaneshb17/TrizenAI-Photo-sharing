import { Link } from 'react-router-dom';

export default function BackButton({ to }) {
  return (
    <Link to={to} className="floating-back-button" aria-label="Go back">
      ← Back
    </Link>
  );
}
