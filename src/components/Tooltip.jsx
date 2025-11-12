import Link from "next/link";
import { useEffect, useRef } from "react";

export default function Tooltip({
  children,
  type = 'btn',
  className = '',
  to = '',
  title = '',
  tabIndex = 0,
  onClick = () => {},
}) {
  const linkElementRef = useRef(null);
  const tooltipClassRef = useRef(null);

  const onLinkElementClicked = (e) => {
    if (tooltipClassRef.current) {
      tooltipClassRef.current.hide();
    }

    return onClick(e);
  };

  const disposeTooltip = () => {
    if (tooltipClassRef.current) {
      tooltipClassRef.current.hide();
      tooltipClassRef.current.dispose();

      tooltipClassRef.current = null;
    }
  };

  const initializeTooltip = (title) => {
    disposeTooltip();

    tooltipClassRef.current = new window.bootstrap.Tooltip(linkElementRef.current, {
      'container': linkElementRef.current,
      'trigger': 'manual',
      'placement': 'bottom',
      'title': title,
    });
  };

  const onMouseEntered = (e) => {
    initializeTooltip(title);

    tooltipClassRef.current.show();
  };

  const onMouseLeave = (e) => {
    disposeTooltip();
  };

  useEffect(() => {
    initializeTooltip(title);

    if (linkElementRef.current.matches(':hover')) {
      tooltipClassRef.current.show();
    } else {
      tooltipClassRef.current.hide();
    }
  }, [title]);

  return (
    <>

      {
        type === 'route' &&
        <Link className={className} to={to} title={title} ref={linkElementRef} tabIndex={tabIndex} onClick={onLinkElementClicked} onMouseEnter={onMouseEntered} onMouseLeave={onMouseLeave}>
          {children}
        </Link>
      }

      {
        type === 'btn' &&
        <a className={className} href="#" onClick={onLinkElementClicked} title={title} ref={linkElementRef} tabIndex={tabIndex} onMouseEnter={onMouseEntered} onMouseLeave={onMouseLeave}>
          {children}
        </a>
      }

    </>
  );
}
