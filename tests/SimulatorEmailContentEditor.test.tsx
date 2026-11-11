import { useState } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { SimulatorEmailContentEditor } from "../src/SimulatorEmailContentEditor";

it("uses fixed mailbox folders and preserves existing data when assigning an email to Draft", () => {
  const original = {
    folders: [{ id: "inbox", name: "Inbox", type: "inbox" }],
    subject: "Retained subject",
    messages: [
      {
        id: "mail",
        folder_id: "outbox",
        subject: "Saved message",
        from: "sender@example.test",
      },
    ],
  };
  let saved = original;
  function Editor() {
    const [value, setValue] = useState<unknown>(original);
    return (
      <SimulatorEmailContentEditor
        value={value}
        onChange={(next) => {
          setValue(next);
          if (typeof next === "object" && next !== null) saved = { ...original, ...next };
        }}
      />
    );
  }
  render(<Editor />);
  expect(screen.queryByLabelText("Email folders")).not.toBeInTheDocument();
  expect(screen.queryByLabelText("Name")).not.toBeInTheDocument();
  expect(screen.queryByLabelText("Type")).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Expand Sent" }));
  fireEvent.click(screen.getByRole("treeitem", { name: "Saved message" }));
  const select = screen.getByRole("combobox", { name: "Folder" });
  expect(select).toHaveValue("Sent");
  fireEvent.focus(select);
  expect(screen.getAllByRole("option").map((item) => item.textContent)).toEqual([
    "Inbox",
    "Draft",
    "Sent",
    "Trash",
  ]);
  fireEvent.change(select, { target: { value: "drafts" } });
  fireEvent.keyDown(select, { key: "Enter" });
  expect(saved.folders).toEqual(original.folders);
  expect(saved.subject).toBe(original.subject);
  expect(saved.messages[0]?.folder_id).toBe("drafts");
  expect(original.messages[0]?.folder_id).toBe("outbox");
});

it("edits legacy link content through Body instead of a separate Links form", () => {
  const value = {
    detail: {
      id: "mail",
      subject: "Bank alert",
      body: "Read this alert.",
      links: [{ href: "https://bank.example.test/verify", text: "Verify your identity" }],
    },
  };
  let saved: unknown;
  render(
    <SimulatorEmailContentEditor
      value={value}
      onChange={(next) => {
        saved = next;
      }}
    />,
  );
  expect(screen.queryByText("Links")).not.toBeInTheDocument();
  expect(screen.queryByLabelText("Href")).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("treeitem", { name: "Bank alert" }));
  const body = screen.getByLabelText("Body");
  expect(body).toHaveValue(
    "Read this alert.\n\nVerify your identity\nhttps://bank.example.test/verify",
  );
  fireEvent.change(body, {
    target: { value: "Updated body with https://bank.example.test/verify" },
  });
  expect(saved).toMatchObject({
    detail: { body: "Updated body with https://bank.example.test/verify" },
  });
  expect(JSON.stringify(saved)).not.toContain('"links"');
});

it("creates complete emails with automatic IDs, editable sent dates and derived 40-character snippets", () => {
  let saved: unknown;
  function Editor() {
    const [value, setValue] = useState<unknown>({});
    return (
      <SimulatorEmailContentEditor
        value={value}
        onChange={(next) => {
          saved = next;
          setValue(next);
        }}
      />
    );
  }
  render(<Editor />);
  fireEvent.click(screen.getByRole("button", { name: "Add emails item" }));
  expect(screen.queryByLabelText("Id")).not.toBeInTheDocument();
  expect(screen.getByRole("combobox", { name: "Folder" })).toHaveValue("Inbox");
  expect(screen.getByLabelText("Sent Date")).toHaveAttribute("type", "date");
  const subject = "A subject longer than forty characters that should be shortened";
  fireEvent.change(screen.getByLabelText("Subject"), { target: { value: subject } });
  expect(screen.queryByLabelText("Snippet")).not.toBeInTheDocument();
  expect(saved).toMatchObject({ messages: [{ snippet: subject.slice(0, 39).trimEnd() + "…" }] });
  fireEvent.change(screen.getByLabelText("Subject"), { target: { value: "" } });
  fireEvent.change(screen.getByLabelText("Body"), { target: { value: "Body fallback" } });
  expect(screen.queryByLabelText("Snippet")).not.toBeInTheDocument();
  expect(saved).toMatchObject({
    messages: [
      {
        id: expect.any(String),
        body: "Body fallback",
        snippet: "Body fallback",
        date_at: expect.stringContaining("T"),
      },
    ],
  });
});

it("shows the shared mailbox recipient for legacy emails and persists edits without restoring a cleared recipient", () => {
  let saved: unknown;
  function Editor() {
    const [value, setValue] = useState<unknown>({
      messages: [{ id: "legacy", subject: "Legacy alert" }],
    });
    return (
      <SimulatorEmailContentEditor
        value={value}
        onChange={(next) => {
          saved = next;
          setValue(next);
        }}
      />
    );
  }
  render(<Editor />);
  fireEvent.click(screen.getByRole("treeitem", { name: "Legacy alert" }));
  expect(screen.getByLabelText("To")).toHaveValue("learner@example.test");
  expect(screen.getByLabelText("Sent Date")).toHaveValue("");
  expect(screen.getByLabelText("Sent Date")).toBeRequired();
  expect(screen.getByLabelText("Time")).toBeRequired();
  expect(screen.getByText("Enter a sent date and time.")).toBeInTheDocument();
  fireEvent.change(screen.getByLabelText("Sent Date"), { target: { value: "2026-11-08" } });
  fireEvent.change(screen.getByLabelText("Time"), { target: { value: "09:45" } });
  expect(screen.queryByText("Enter a sent date and time.")).not.toBeInTheDocument();
  expect(saved).toMatchObject({
    messages: [{ date_at: new Date("2026-11-08T09:45").toISOString() }],
  });
  fireEvent.change(screen.getByLabelText("To"), { target: { value: "recipient@example.test" } });
  expect(saved).toMatchObject({ messages: [{ to: "recipient@example.test" }] });
  fireEvent.change(screen.getByLabelText("To"), { target: { value: "" } });
  expect(screen.getByLabelText("To")).toHaveValue("");
  expect(saved).toMatchObject({ messages: [{ to: "" }] });
});

it("keeps four fixed folders and moves the selected email between their tree branches", () => {
  function Editor() {
    const [value, setValue] = useState<unknown>({ messages: [] });
    return <SimulatorEmailContentEditor value={value} onChange={setValue} />;
  }
  render(<Editor />);
  expect(screen.getAllByRole("treeitem").map((item) => item.getAttribute("aria-label"))).toEqual([
    "Inbox",
    "Draft",
    "Sent",
    "Trash",
  ]);
  expect(screen.queryByRole("button", { name: "Remove Inbox" })).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Add item to Draft" }));
  expect(screen.getByRole("combobox", { name: "Folder" })).toHaveValue("Draft");
  fireEvent.change(screen.getByLabelText("Subject"), { target: { value: "Tree trial" } });
  fireEvent.change(screen.getByRole("combobox", { name: "Folder" }), { target: { value: "sent" } });
  fireEvent.keyDown(screen.getByRole("combobox", { name: "Folder" }), { key: "Enter" });
  expect(screen.getByRole("treeitem", { name: "Sent" })).toHaveAttribute("aria-expanded", "true");
  expect(screen.getByRole("treeitem", { name: "Tree trial" })).toHaveAttribute(
    "aria-selected",
    "true",
  );
  expect(screen.getByLabelText("Subject")).toHaveValue("Tree trial");
  fireEvent.click(screen.getByRole("button", { name: "Remove Tree trial" }));
  expect(screen.queryByLabelText("Subject")).not.toBeInTheDocument();
  expect(screen.getByRole("treeitem", { name: "Sent" })).toBeInTheDocument();
  expect(screen.getAllByRole("treeitem")).toHaveLength(4);
});

it("creates a custom folder, reuses it for another email and protects basic folder identities", () => {
  let saved: unknown;
  function Editor() {
    const [value, setValue] = useState<unknown>({
      messages: [
        { id: "one", subject: "First", folder_id: "inbox" },
        { id: "two", subject: "Second", folder_id: "inbox" },
      ],
    });
    return (
      <SimulatorEmailContentEditor
        value={value}
        onChange={(next) => {
          saved = next;
          setValue(next);
        }}
      />
    );
  }
  render(<Editor />);
  fireEvent.click(screen.getByRole("treeitem", { name: "First" }));
  const folder = screen.getByRole("combobox", { name: "Folder" });
  fireEvent.change(folder, { target: { value: "Projects" } });
  fireEvent.change(screen.getByRole("listbox", { name: "Folders" }), {
    target: { value: "Projects" },
  });
  expect(folder).toHaveValue("Projects");
  expect(screen.getByRole("treeitem", { name: "Projects" })).toHaveAttribute(
    "aria-expanded",
    "true",
  );
  fireEvent.click(screen.getByRole("treeitem", { name: "Second" }));
  fireEvent.change(folder, { target: { value: "projects" } });
  fireEvent.keyDown(folder, { key: "Enter" });
  expect(saved).toMatchObject({ messages: [{ folder_id: "Projects" }, { folder_id: "Projects" }] });
  expect(screen.getAllByRole("treeitem", { name: "Projects" })).toHaveLength(1);
  fireEvent.change(folder, { target: { value: "INBOX" } });
  fireEvent.blur(folder);
  expect(saved).toMatchObject({ messages: [{ folder_id: "Projects" }, { folder_id: "inbox" }] });
  for (const name of ["Inbox", "Draft", "Sent", "Trash"]) {
    expect(screen.getByRole("treeitem", { name })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: `Remove ${name}` })).not.toBeInTheDocument();
  }
});
