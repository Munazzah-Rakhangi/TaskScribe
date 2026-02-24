export type ActionItem = {
  task: string;
  owner?: string;
  deadline?: string;
};

export type MeetingTemplate = {
  id: string;
  name: string;
  defaultTitle: string;
  defaultActionItems: ActionItem[];
};

export const MEETING_TEMPLATES: MeetingTemplate[] = [
  {
    id: "blank",
    name: "Blank",
    defaultTitle: "",
    defaultActionItems: [{ task: "", owner: "", deadline: "" }],
  },
  {
    id: "1-1",
    name: "1:1 Check-in",
    defaultTitle: "1:1 Check-in",
    defaultActionItems: [
      { task: "", owner: "", deadline: "" },
      { task: "", owner: "", deadline: "" },
    ],
  },
  {
    id: "standup",
    name: "Team Standup",
    defaultTitle: "Daily Standup",
    defaultActionItems: [
      { task: "What did you accomplish?", owner: "", deadline: "" },
      { task: "What will you work on today?", owner: "", deadline: "" },
      { task: "Blockers or help needed?", owner: "", deadline: "" },
    ],
  },
  {
    id: "retro",
    name: "Project Retrospective",
    defaultTitle: "Project Retrospective",
    defaultActionItems: [
      { task: "What went well?", owner: "", deadline: "" },
      { task: "What could improve?", owner: "", deadline: "" },
      { task: "", owner: "", deadline: "" },
    ],
  },
  {
    id: "interview",
    name: "Interview",
    defaultTitle: "Interview Notes",
    defaultActionItems: [
      { task: "Key takeaways", owner: "", deadline: "" },
      { task: "Follow-up items", owner: "", deadline: "" },
    ],
  },
  {
    id: "brainstorm",
    name: "Brainstorm / Planning",
    defaultTitle: "Brainstorm Session",
    defaultActionItems: [
      { task: "", owner: "", deadline: "" },
      { task: "", owner: "", deadline: "" },
    ],
  },
];
