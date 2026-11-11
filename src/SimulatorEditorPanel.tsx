import { useId, useState, type ReactNode } from "react";

export function SimulatorEditorPanel({
  title,
  children,
  onAdd,
  addLabel,
  actions,
}: Readonly<{
  title: string;
  children: ReactNode;
  onAdd?: () => void;
  addLabel?: string;
  actions?: ReactNode;
}>) {
  const [open, setOpen] = useState(true);
  const id = useId();
  return (
    <section className="graph-editor-card mb-3" aria-label={`${title} panel`}>
      <div className="graph-editor-card__header d-flex align-items-center justify-content-between">
        <div className="d-flex align-items-center">
          <span>{title}</span>
          <button
            type="button"
            className={`graph-editor-btn graph-editor-btn--panel-${open ? "collapse" : "expand"}`}
            aria-label={`${open ? "Collapse" : "Expand"} ${title.toLowerCase()}`}
            aria-expanded={open}
            aria-controls={id}
            onClick={() => setOpen(!open)}
          />
        </div>
        {actions}
        {onAdd && (
          <button
            type="button"
            className="graph-editor-btn graph-editor-btn--panel-add-choice"
            aria-label={addLabel}
            title={addLabel}
            onClick={() => {
              setOpen(true);
              onAdd();
            }}
          />
        )}
      </div>
      <div id={id} hidden={!open}>
        {children}
      </div>
    </section>
  );
}
