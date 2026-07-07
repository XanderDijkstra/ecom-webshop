"use client";

import { useState } from "react";

export function Newsletter() {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    // No backend yet; store locally so the signup isn't lost, and confirm.
    try {
      const key = "bara_newsletter";
      const list = JSON.parse(localStorage.getItem(key) || "[]");
      localStorage.setItem(key, JSON.stringify([...list, email]));
    } catch {
      /* ignore */
    }
    setDone(true);
  }

  return (
    <section className="bg-cream">
      <div className="mx-auto max-w-[620px] px-7 py-[70px] text-center">
        <div className="mb-[14px] text-[12px] uppercase tracking-[0.16em] text-clay">
          Nyhetsbrev
        </div>
        <h2 className="mb-3 font-serif text-[clamp(26px,3.4vw,36px)] font-normal leading-[1.1]">
          Meld deg på, få 10 % på første kjøp
        </h2>
        <p className="mb-7 text-[16px] leading-[1.6] text-muted-2">
          Vær først ute på nye mønstre og eksklusive tilbud. Ingen spam, bare
          gode nyheter for småbarnsforeldre.
        </p>

        {done ? (
          <p className="text-[16px] font-medium text-clay">
            Takk! Sjekk innboksen din for rabattkoden. 🎉
          </p>
        ) : (
          <form
            onSubmit={submit}
            className="mx-auto flex max-w-[440px] flex-col gap-3 sm:flex-row"
          >
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="E-postadressen din"
              className="flex-1 rounded-full border border-line bg-white px-5 py-[14px] text-[15px] text-ink outline-none transition-colors focus:border-clay"
            />
            <button
              type="submit"
              className="rounded-full bg-ink px-7 py-[14px] text-[15px] font-semibold text-cream transition-colors hover:bg-clay"
            >
              Meld meg på
            </button>
          </form>
        )}
      </div>
    </section>
  );
}
