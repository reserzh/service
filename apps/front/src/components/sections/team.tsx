interface TeamSectionProps {
  content: Record<string, unknown>;
  settings: Record<string, unknown>;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((part) => part.charAt(0))
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function TeamSection({ content, settings }: TeamSectionProps) {
  const heading = (content.heading as string) || "";
  const description = content.description as string | undefined;
  const members =
    (content.members as Array<{
      name: string;
      role: string;
      photo?: string;
      bio?: string;
    }>) || [];

  const backgroundColor = (settings.backgroundColor as string) || undefined;
  const columns = (settings.columns as number) || 3;

  const gridColsClass =
    columns === 2
      ? "sm:grid-cols-2"
      : columns === 4
        ? "sm:grid-cols-2 lg:grid-cols-4"
        : "sm:grid-cols-2 lg:grid-cols-3";

  return (
    <section
      className="py-16 px-4 sm:px-6 lg:px-8"
      style={{ backgroundColor }}
    >
      <div className="mx-auto max-w-7xl">
        {heading && (
          <h2 className="text-center text-3xl font-bold tracking-tight sm:text-4xl">
            {heading}
          </h2>
        )}
        {description && (
          <p className="mt-4 text-center text-lg text-gray-600 max-w-2xl mx-auto">
            {description}
          </p>
        )}
        <div className={`mt-12 grid grid-cols-1 gap-8 ${gridColsClass}`}>
          {members.map((member, index) => (
            <div
              key={index}
              className="flex flex-col items-center rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-100"
            >
              {member.photo ? (
                <img
                  src={member.photo}
                  alt={member.name}
                  className="h-24 w-24 rounded-full object-cover"
                />
              ) : (
                <div
                  className="flex h-24 w-24 items-center justify-center rounded-full text-2xl font-bold text-white"
                  style={{ backgroundColor: "var(--color-primary)" }}
                >
                  {getInitials(member.name)}
                </div>
              )}
              <h3 className="mt-4 text-lg font-semibold">{member.name}</h3>
              <p
                className="text-sm font-medium"
                style={{ color: "var(--color-secondary)" }}
              >
                {member.role}
              </p>
              {member.bio && (
                <p className="mt-3 text-center text-sm text-gray-600 leading-relaxed">
                  {member.bio}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
