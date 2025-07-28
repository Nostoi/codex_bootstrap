import React, { useState } from "react";

export interface ReflectionPromptProps {
  question: string;
  onSubmit: (answer: string) => void;
}

export default function ReflectionPrompt({ question, onSubmit }: ReflectionPromptProps) {
  const [answer, setAnswer] = useState("");
  return (
    <form
      className="rounded-md border-2 p-4 shadow-sm bg-neutral"
      onSubmit={e => {
        e.preventDefault();
        onSubmit(answer);
        setAnswer("");
      }}
      aria-label="Reflection prompt"
    >
      <label className="block font-semibold mb-2" htmlFor="reflection-input">{question}</label>
      <textarea
        id="reflection-input"
        className="w-full p-2 rounded border border-secondary mb-2"
        value={answer}
        onChange={e => setAnswer(e.target.value)}
        rows={3}
        required
        aria-required="true"
      />
      <button type="submit" className="bg-primary text-white px-4 py-2 rounded">Submit</button>
    </form>
  );
}
