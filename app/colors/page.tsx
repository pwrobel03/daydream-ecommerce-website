import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const ColorsPage = () => {
  const colorGroups = [
    {
      title: "Podstawowe (Core)",
      colors: [
        { name: "Background", class: "bg-background", text: "text-foreground" },
        { name: "Foreground", class: "bg-foreground", text: "text-background" },
        { name: "Card", class: "bg-card", text: "text-card-foreground" },
        {
          name: "Popover",
          class: "bg-popover",
          text: "text-popover-foreground",
        },
      ],
    },
    {
      title: "Akcji (Actions)",
      colors: [
        {
          name: "Primary",
          class: "bg-primary",
          text: "text-primary-foreground",
        },
        {
          name: "Secondary",
          class: "bg-secondary",
          text: "text-secondary-foreground",
        },
        { name: "Accent", class: "bg-accent", text: "text-accent-foreground" },
        { name: "Muted", class: "bg-muted", text: "text-muted-foreground" },
        { name: "Destructive", class: "bg-destructive", text: "text-white" },
      ],
    },
    {
      title: "Interfejs (UI)",
      colors: [
        { name: "Border", class: "bg-border", text: "text-foreground" },
        { name: "Input", class: "bg-input", text: "text-foreground" },
        { name: "Ring", class: "bg-ring", text: "text-white" },
      ],
    },
    {
      title: "Wykresy (Charts)",
      colors: [
        { name: "Chart 1", class: "bg-chart-1", text: "text-white" },
        { name: "Chart 2", class: "bg-chart-2", text: "text-white" },
        { name: "Chart 3", class: "bg-chart-3", text: "text-white" },
        { name: "Chart 4", class: "bg-chart-4", text: "text-white" },
        { name: "Chart 5", class: "bg-chart-5", text: "text-white" },
      ],
    },
  ];

  return (
    <div className="p-8 space-y-8 bg-background">
      <div className="max-w-5xl mx-auto space-y-12">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-foreground">
            Paleta Oat & Earth
          </h1>
          <p className="text-muted-foreground italic">
            Podgląd wszystkich zdefiniowanych zmiennych RGB dla Twojego sklepu.
          </p>
        </div>

        {colorGroups.map((group) => (
          <section key={group.title} className="space-y-4">
            <h2 className="text-xl font-semibold border-b pb-2">
              {group.title}
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
              {group.colors.map((color) => (
                <div
                  key={color.name}
                  className="flex flex-col gap-2 items-center"
                >
                  <div
                    className={`w-[100px] h-[100px] ${color.class} border shadow-sm rounded-xl flex items-center justify-center text-[10px] font-bold text-center p-2 uppercase`}
                  >
                    <span className={color.text}>{color.name}</span>
                  </div>
                  <span className="text-xs font-mono text-muted-foreground">
                    {color.class}
                  </span>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
};

export default ColorsPage;
