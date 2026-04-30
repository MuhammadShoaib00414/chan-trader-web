export default function AppLink({
  router,
  to,
  children,
  className,
  onClick,
  ...rest
}) {
  const handleClick = (event) => {
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey ||
      !router
    ) {
      return;
    }

    event.preventDefault();
    onClick?.(event);
    router.navigate(to);
  };

  return (
    <a className={className} href={to} onClick={handleClick} {...rest}>
      {children}
    </a>
  );
}
