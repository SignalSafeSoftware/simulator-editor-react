import { useState } from "react";
import { createLock, isLockAvailable } from "@signalsafe/simulator-react/apps/lock/lock";
import type { HomeContent } from "./simulatorHomeContent.js";
export function SimulatorHomeLockEditor({
  value,
  onChange,
}: Readonly<{
  value: HomeContent["settings"]["lock"];
  onChange: (value: HomeContent["settings"]["lock"]) => void;
}>) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const available = isLockAvailable();
  return (
    <fieldset disabled={busy} className="mt-3">
      <legend className="h6">Screen password</legend>
      <p>{value ? "Password configured" : "No screen password"}</p>
      <label className="form-label d-block mb-3">
        New screen password
        <input
          className="form-control"
          type="password"
          autoComplete="new-password"
          minLength={4}
          maxLength={128}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={!available}
        />
      </label>
      <div className="d-flex flex-wrap gap-2">
        <button
          type="button"
          className="btn btn-outline-primary"
          disabled={!available || password.length < 4}
          onClick={async () => {
            setBusy(true);
            setError("");
            try {
              onChange(await createLock(password));
              setPassword("");
            } catch (e) {
              setError(e instanceof Error ? e.message : "Could not set the screen password.");
            } finally {
              setBusy(false);
            }
          }}
        >
          Set screen password
        </button>
        {value && (
          <button type="button" className="btn btn-outline-danger" onClick={() => onChange(null)}>
            Remove screen password
          </button>
        )}
      </div>
      {!available && (
        <p className="text-muted">
          Screen passwords require HTTPS and browser cryptography support.
        </p>
      )}
      {error && (
        <p role="alert" className="text-danger">
          {error}
        </p>
      )}
    </fieldset>
  );
}
