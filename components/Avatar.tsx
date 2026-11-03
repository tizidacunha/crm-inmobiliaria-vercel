function initial(name: string) {
  return name?.trim()?.[0] || '?';
}

export default function Avatar({
  name,
  pictureUrl,
  large,
}: {
  name: string;
  pictureUrl: string | null;
  large?: boolean;
}) {
  const className = `avatar${large ? ' large' : ''}`;
  if (pictureUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={pictureUrl} alt={name} className={className} />;
  }
  return <div className={className}>{initial(name)}</div>;
}
