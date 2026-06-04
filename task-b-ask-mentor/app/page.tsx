"use client";

// Демо UI за POST /api/ask-mentor. Същинският deliverable е API route-ът.

import { useState } from "react";
import ReactMarkdown from "react-markdown";

const MAX_QUESTION = 2000;
const MAX_FIELD = 120;

export default function Home() {
  const [question, setQuestion] = useState("");
  const [name, setName] = useState("");
  const [businessType, setBusinessType] = useState("");
  const [monthlyRevenue, setMonthlyRevenue] = useState("");
  const [membershipDays, setMembershipDays] = useState("");
  const [lastResource, setLastResource] = useState("");

  const [loading, setLoading] = useState(false);
  const [answer, setAnswer] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!question.trim() || loading) return;

    setLoading(true);
    setAnswer("");
    setError("");

    const userContext: Record<string, string | number> = {};
    if (name.trim()) userContext.name = name.trim();
    if (businessType.trim()) userContext.business_type = businessType.trim();
    if (monthlyRevenue.trim()) userContext.monthly_revenue = monthlyRevenue.trim();
    if (membershipDays.trim()) userContext.membership_days = Number(membershipDays);
    if (lastResource.trim()) userContext.last_completed_resource = lastResource.trim();

    try {
      const res = await fetch("/api/ask-mentor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: question.trim(),
          ...(Object.keys(userContext).length > 0 ? { user_context: userContext } : {}),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data?.error || "Възникна грешка.");
      } else {
        setAnswer(data.answer || "");
      }
    } catch {
      setError("Неуспешна връзка със сървъра.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="am-page">
      <div className="am-card">
        <div className="am-topbar">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/mabi-logo.svg" alt="МАБИ" className="am-logo" />
          <h1 className="am-title">AI Ментор</h1>
        </div>
        <div className="am-body">
          <p className="am-subtitle">
            Задай бизнес въпрос. Отговорите са директни и практични — в стила на МАБИ.
          </p>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSubmit();
            }}
          >
            <label className="am-label" htmlFor="am-question">
              Твоят въпрос
            </label>
            <textarea
              id="am-question"
              className="am-textarea"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Напр.: Как да вдигна цените си без да губя клиенти?"
              maxLength={MAX_QUESTION}
              disabled={loading}
            />
            <p className="am-hint">
              Колкото по-конкретен е въпросът, толкова по-полезен е отговорът.
            </p>

            <div className="am-context">
              <div className="am-context-title">Контекст за теб (опционално)</div>
              <div className="am-grid">
                <div className="am-field">
                  <label className="am-label" htmlFor="am-name">Име</label>
                  <input id="am-name" className="am-input" value={name} maxLength={MAX_FIELD}
                    onChange={(e) => setName(e.target.value)} placeholder="Иван" disabled={loading} />
                  <p className="am-hint">За по-личен тон на отговора.</p>
                </div>
                <div className="am-field">
                  <label className="am-label" htmlFor="am-business">Тип бизнес</label>
                  <input id="am-business" className="am-input" value={businessType} maxLength={MAX_FIELD}
                    onChange={(e) => setBusinessType(e.target.value)} placeholder="консултантски услуги" disabled={loading} />
                  <p className="am-hint">С какво се занимаваш.</p>
                </div>
                <div className="am-field">
                  <label className="am-label" htmlFor="am-revenue">Месечен оборот</label>
                  <input id="am-revenue" className="am-input" value={monthlyRevenue} maxLength={MAX_FIELD}
                    onChange={(e) => setMonthlyRevenue(e.target.value)} placeholder="25000 €" disabled={loading} />
                  <p className="am-hint">Приблизително, напр. 25000 € месечно.</p>
                </div>
                <div className="am-field">
                  <label className="am-label" htmlFor="am-days">Дни като член</label>
                  <input id="am-days" className="am-input" type="number" min={0} value={membershipDays}
                    onChange={(e) => setMembershipDays(e.target.value)} placeholder="45" disabled={loading} />
                  <p className="am-hint">Откога си в МАБИ (в дни).</p>
                </div>
                <div className="am-field">
                  <label className="am-label" htmlFor="am-resource">Последен завършен ресурс</label>
                  <input id="am-resource" className="am-input" value={lastResource} maxLength={MAX_FIELD}
                    onChange={(e) => setLastResource(e.target.value)} placeholder="напр. Margin Fix" disabled={loading} />
                  <p className="am-hint">Курс/ресурс от платформата (в реалния продукт се попълва автоматично).</p>
                </div>
              </div>
            </div>

            <button className="am-button" type="submit" disabled={loading || !question.trim()}>
              {loading ? "Ментора мисли…" : "Попитай ментора"}
            </button>
          </form>

          {answer && (
            <div className="am-answer">
              <div className="am-answer-title">🎯 Отговор на ментора</div>
              <div className="am-answer-text am-markdown">
                <ReactMarkdown>{answer}</ReactMarkdown>
              </div>
            </div>
          )}

          {error && <div className="am-error">⚠️ {error}</div>}
        </div>
      </div>
    </main>
  );
}
