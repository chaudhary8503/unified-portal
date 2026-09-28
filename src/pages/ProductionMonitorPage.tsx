import LaunchCard from '../components/LaunchCard';

// TODO: replace with the deployed production monitor URL.
const PRODUCTION_MONITOR_URL = 'https://production-monitor-chi.vercel.app/';

function ProductionMonitorPage() {
  return (
    <LaunchCard
      title="Production Monitor"
      description="Operator entry and the owner dashboard run as their own app. It opens in a new tab."
      url={PRODUCTION_MONITOR_URL}
      buttonLabel="Open Production Monitor"
    />
  );
}

export default ProductionMonitorPage;
