import LaunchCard from '../components/LaunchCard';

// TODO: replace with the deployed rate calculator URL.
const RATE_CALCULATOR_URL = 'https://powerant-mobile.web.app/';

function RateCalculatorPage() {
  return (
    <LaunchCard
      title="Rate Calculator"
      description="The rate calculator runs as its own app. It opens in a new tab."
      url={RATE_CALCULATOR_URL}
      buttonLabel="Open Rate Calculator"
    />
  );
}

export default RateCalculatorPage;
