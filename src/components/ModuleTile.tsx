import type { PortalModule } from '../modules';
import ModuleIcon from './ModuleIcon';
import './ModuleTile.css';

interface ModuleTileProps {
  module: PortalModule;
}

/** Large launch button for a module — opens the deployed app in a new tab. */
function ModuleTile({ module }: ModuleTileProps) {
  return (
    <a className="module-tile" href={module.url} target="_blank" rel="noopener noreferrer">
      <span className="module-tile-icon">
        <ModuleIcon module={module.id} size={24} />
      </span>
      <span className="module-tile-text">
        <span className="module-tile-name">{module.name}</span>
        <span className="module-tile-desc">{module.description}</span>
      </span>
      <span className="module-tile-arrow" aria-hidden="true">
        ↗
      </span>
    </a>
  );
}

export default ModuleTile;
