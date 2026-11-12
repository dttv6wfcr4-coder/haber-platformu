"use client";

export default function SelectAll() {
  return (
    <label className="adm-all">
      <input
        type="checkbox"
        onChange={(e) =>
          document
            .querySelectorAll('input[name="ids"]')
            .forEach((c) => (c.checked = e.target.checked))
        }
      />
      Tümünü seç
    </label>
  );
}
