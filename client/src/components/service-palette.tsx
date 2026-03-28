import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Search,
  ChevronRight,
  Cpu,
  HardDrive,
  Database,
  Network,
  Shield,
  Webhook,
  Brain,
  BarChart3,
  Settings,
  Code,
  Box,
  Monitor,
  Wifi,
  MoveRight,
  GripVertical,
} from "lucide-react";
import { serviceCategories, getServiceIconUrl, type AwsService } from "@/data/aws-services";

const categoryIcons: Record<string, any> = {
  Cpu,
  HardDrive,
  Database,
  Network,
  Shield,
  Webhook,
  Brain,
  BarChart3,
  Settings,
  Code,
  Container: Box,
  Monitor,
  Wifi,
  MoveRight,
};

export interface BoundaryType {
  id: string;
  label: string;
  groupType: "region" | "vpc" | "subnet" | "availability-zone" | "security-group";
  icon: string;
  description: string;
  color: string;
}

export const boundaryTypes: BoundaryType[] = [
  { id: "region", label: "Region", groupType: "region", icon: "🌍", description: "AWS Region boundary", color: "#60a5fa" },
  { id: "vpc", label: "VPC", groupType: "vpc", icon: "🔒", description: "Virtual Private Cloud", color: "#34d399" },
  { id: "public-subnet", label: "Public Subnet", groupType: "subnet", icon: "🔗", description: "Public subnet (internet-facing)", color: "#fbbf24" },
  { id: "private-subnet", label: "Private Subnet", groupType: "subnet", icon: "🔗", description: "Private subnet (internal only)", color: "#f59e0b" },
  { id: "availability-zone", label: "Availability Zone", groupType: "availability-zone", icon: "🏢", description: "AZ boundary", color: "#a78bfa" },
  { id: "security-group", label: "Security Group", groupType: "security-group", icon: "🛡️", description: "Security group boundary", color: "#f87171" },
];

interface ServicePaletteProps {
  onDragStart: (event: React.DragEvent, service: AwsService) => void;
  onBoundaryDragStart?: (event: React.DragEvent, boundary: BoundaryType) => void;
}

export function ServicePalette({ onDragStart, onBoundaryDragStart }: ServicePaletteProps) {
  const [search, setSearch] = useState("");
  const [openCategories, setOpenCategories] = useState<Set<string>>(
    new Set(["Compute", "Storage", "Database", "Networking"])
  );

  const filteredCategories = useMemo(() => {
    if (!search.trim()) return serviceCategories;

    const q = search.toLowerCase();
    return serviceCategories
      .map((cat) => ({
        ...cat,
        services: cat.services.filter(
          (s) =>
            s.name.toLowerCase().includes(q) ||
            s.shortName.toLowerCase().includes(q) ||
            s.description.toLowerCase().includes(q) ||
            s.id.includes(q)
        ),
      }))
      .filter((cat) => cat.services.length > 0);
  }, [search]);

  const toggleCategory = (name: string) => {
    setOpenCategories((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  const totalServices = serviceCategories.reduce(
    (n, c) => n + c.services.length,
    0
  );

  return (
    <div className="h-full flex flex-col bg-sidebar border-r border-sidebar-border">
      {/* Header */}
      <div className="p-3 border-b border-sidebar-border flex-shrink-0">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-7 h-7 bg-primary rounded-md flex items-center justify-center">
            <svg
              viewBox="0 0 24 24"
              className="w-4 h-4 text-primary-foreground"
              fill="currentColor"
            >
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
          </div>
          <div>
            <h2 className="text-sm font-semibold text-sidebar-foreground leading-tight">
              AWS Services
            </h2>
            <p className="text-[10px] text-muted-foreground">
              {totalServices} services available
            </p>
          </div>
        </div>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search services..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-8 text-xs bg-background"
            data-testid="input-search-services"
          />
        </div>
      </div>

      {/* Service Categories */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-0.5">
          {/* Boundaries Section */}
          {!search.trim() && (
            <Collapsible
              open={openCategories.has("Boundaries")}
              onOpenChange={() => toggleCategory("Boundaries")}
            >
              <CollapsibleTrigger
                className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-sidebar-accent transition-colors text-left"
                data-testid="category-boundaries"
              >
                <ChevronRight
                  className={`w-3.5 h-3.5 text-muted-foreground transition-transform ${
                    openCategories.has("Boundaries") ? "rotate-90" : ""
                  }`}
                />
                <Box className="w-3.5 h-3.5 flex-shrink-0 text-emerald-500" />
                <span className="text-xs font-medium text-sidebar-foreground flex-1">
                  Boundaries
                </span>
                <Badge
                  variant="secondary"
                  className="text-[10px] h-4 px-1.5 min-w-0"
                >
                  {boundaryTypes.length}
                </Badge>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="ml-3 pl-3 border-l border-sidebar-border space-y-0.5 py-1">
                  {boundaryTypes.map((boundary) => (
                    <div
                      key={boundary.id}
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData(
                          "application/aws-boundary",
                          JSON.stringify(boundary)
                        );
                        e.dataTransfer.effectAllowed = "move";
                        onBoundaryDragStart?.(e, boundary);
                      }}
                      className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-sidebar-accent cursor-grab active:cursor-grabbing transition-colors group"
                      data-testid={`boundary-drag-${boundary.id}`}
                      title={boundary.description}
                    >
                      <GripVertical className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                      <span className="text-base flex-shrink-0">{boundary.icon}</span>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-medium text-sidebar-foreground leading-tight truncate">
                          {boundary.label}
                        </div>
                        <div className="text-[10px] text-muted-foreground leading-tight truncate">
                          {boundary.description}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>
          )}

          {filteredCategories.map((category) => {
            const IconComp = categoryIcons[category.icon] || Box;
            const isOpen = openCategories.has(category.name) || !!search.trim();

            return (
              <Collapsible
                key={category.name}
                open={isOpen}
                onOpenChange={() => toggleCategory(category.name)}
              >
                <CollapsibleTrigger
                  className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-sidebar-accent transition-colors text-left"
                  data-testid={`category-${category.name.toLowerCase().replace(/\s+/g, "-")}`}
                >
                  <ChevronRight
                    className={`w-3.5 h-3.5 text-muted-foreground transition-transform ${
                      isOpen ? "rotate-90" : ""
                    }`}
                  />
                  <IconComp
                    className="w-3.5 h-3.5 flex-shrink-0"
                    style={{ color: category.color }}
                  />
                  <span className="text-xs font-medium text-sidebar-foreground flex-1">
                    {category.name}
                  </span>
                  <Badge
                    variant="secondary"
                    className="text-[10px] h-4 px-1.5 min-w-0"
                  >
                    {category.services.length}
                  </Badge>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="ml-3 pl-3 border-l border-sidebar-border space-y-0.5 py-1">
                    {category.services.map((service) => (
                      <div
                        key={service.id}
                        draggable
                        onDragStart={(e) => onDragStart(e, service)}
                        className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-sidebar-accent cursor-grab active:cursor-grabbing transition-colors group"
                        data-testid={`service-drag-${service.id}`}
                        title={service.description}
                      >
                        <GripVertical className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                        <img
                          src={getServiceIconUrl(service.iconSlug)}
                          alt={service.name}
                          className="w-5 h-5 flex-shrink-0"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = "none";
                          }}
                        />
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-medium text-sidebar-foreground leading-tight truncate">
                            {service.shortName}
                          </div>
                          <div className="text-[10px] text-muted-foreground leading-tight truncate">
                            {service.description}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            );
          })}

          {filteredCategories.length === 0 && (
            <div className="px-4 py-8 text-center">
              <p className="text-xs text-muted-foreground">
                No services found for "{search}"
              </p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
