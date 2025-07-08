import { ReactNode, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

interface PortalProps {
  children: ReactNode;
  containerId?: string;
}

const Portal: React.FC<PortalProps> = ({ children, containerId = 'portal-root' }) => {
  const [container, setContainer] = useState<HTMLElement | null>(null);

  useEffect(() => {
    let element = document.getElementById(containerId);
    
    if (!element) {
      element = document.createElement('div');
      element.id = containerId;
      document.body.appendChild(element);
    }
    
    setContainer(element);
    
    return () => {
      // Optionally clean up if the portal is unmounted
      if (element && element.children.length === 0) {
        document.body.removeChild(element);
      }
    };
  }, [containerId]);

  return container ? createPortal(children, container) : null;
};

export default Portal;
