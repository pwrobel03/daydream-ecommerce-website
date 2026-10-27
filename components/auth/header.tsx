interface HeaderProps {
  title: string;
  description?: string;
}

export const Header = ({ title, description }: HeaderProps) => {
  return (
    <div className="space-y-2">
      <h1 className="font-display text-3xl leading-tight text-balance">{title}</h1>
      {description && <p className="text-muted-foreground text-sm">{description}</p>}
    </div>
  );
};
