import { Meta, StoryObj } from "@storybook/react";
import ProjectCard from "./ProjectCard";

const meta: Meta<typeof ProjectCard> = {
  title: "UI/ProjectCard",
  component: ProjectCard,
  parameters: {
    a11y: { config: { rules: [{ id: 'color-contrast', enabled: true }] } },
  },
};
export default meta;

type Story = StoryObj<typeof ProjectCard>;

export const Default: Story = {
  args: {
    id: "p1",
    name: "Helmsman Redesign",
    area: "Productivity",
    purpose: "Reduce cognitive load",
  },
};

export const Highlighted: Story = {
  args: {
    id: "p2",
    name: "AI Integration",
    area: "AI",
    purpose: "Proactive suggestions",
  },
};
