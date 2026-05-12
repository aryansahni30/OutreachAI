import { useState } from 'react';
import { ArrowRight, Building2, FileText, Link2, Mail, Target, User } from 'lucide-react';
import type { OutreachRequest } from '../types';

interface InputFormProps {
  onSubmit: (request: OutreachRequest) => void;
  isLoading: boolean;
}

export function InputForm({ onSubmit, isLoading }: InputFormProps) {
  const [company, setCompany] = useState('');
  const [resumeText, setResumeText] = useState('');
  const [goal, setGoal] = useState('');
  const [senderName, setSenderName] = useState('');
  const [senderEmail, setSenderEmail] = useState('');
  const [linkedinConnections, setLinkedinConnections] = useState('');
  const [showLinkedin, setShowLinkedin] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      company,
      resume_text: resumeText,
      goal,
      sender_name: senderName,
      sender_email: senderEmail,
      linkedin_connections: linkedinConnections,
    });
  };

  const isValid = company.trim() && resumeText.trim() && senderName.trim() && senderEmail.trim();

  return (
    <form onSubmit={handleSubmit}>
      <div className="rounded-2xl bg-[var(--color-surface-raised)] border border-[var(--color-border-subtle)] p-6 sm:p-8 space-y-6 gradient-border">
        {/* Name + Email row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className="flex items-center gap-1.5 text-sm font-medium text-[var(--color-text-secondary)] mb-2">
              <User size={14} />
              Your Name
            </label>
            <input
              type="text"
              value={senderName}
              onChange={(e) => setSenderName(e.target.value)}
              placeholder="Aryan Sahni"
              className="w-full px-4 py-3 bg-[var(--color-surface)] border border-[var(--color-border-subtle)] rounded-xl text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/40 focus:border-[var(--color-primary)]/40 transition-all"
            />
          </div>
          <div>
            <label className="flex items-center gap-1.5 text-sm font-medium text-[var(--color-text-secondary)] mb-2">
              <Mail size={14} />
              Your Email
            </label>
            <input
              type="email"
              value={senderEmail}
              onChange={(e) => setSenderEmail(e.target.value)}
              placeholder="aryan@example.com"
              className="w-full px-4 py-3 bg-[var(--color-surface)] border border-[var(--color-border-subtle)] rounded-xl text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/40 focus:border-[var(--color-primary)]/40 transition-all"
            />
          </div>
        </div>

        {/* Company */}
        <div>
          <label className="flex items-center gap-1.5 text-sm font-medium text-[var(--color-text-secondary)] mb-2">
            <Building2 size={14} />
            Target Company
          </label>
          <input
            type="text"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            placeholder="Salesforce"
            className="w-full px-4 py-3 bg-[var(--color-surface)] border border-[var(--color-border-subtle)] rounded-xl text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/40 focus:border-[var(--color-primary)]/40 transition-all"
          />
        </div>

        {/* Goal */}
        <div>
          <label className="flex items-center gap-1.5 text-sm font-medium text-[var(--color-text-secondary)] mb-2">
            <Target size={14} />
            Goal
            <span className="text-[var(--color-text-muted)] font-normal">(optional)</span>
          </label>
          <input
            type="text"
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            placeholder="Applying for ML Engineer role"
            className="w-full px-4 py-3 bg-[var(--color-surface)] border border-[var(--color-border-subtle)] rounded-xl text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/40 focus:border-[var(--color-primary)]/40 transition-all"
          />
        </div>

        {/* Resume */}
        <div>
          <label className="flex items-center gap-1.5 text-sm font-medium text-[var(--color-text-secondary)] mb-2">
            <FileText size={14} />
            Resume / Background
          </label>
          <textarea
            value={resumeText}
            onChange={(e) => setResumeText(e.target.value)}
            placeholder="Paste your resume or describe your background, skills, and experience..."
            rows={5}
            className="w-full px-4 py-3 bg-[var(--color-surface)] border border-[var(--color-border-subtle)] rounded-xl text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/40 focus:border-[var(--color-primary)]/40 transition-all resize-none leading-relaxed"
          />
        </div>

        {/* LinkedIn Connections — collapsible */}
        <div>
          <button
            type="button"
            onClick={() => setShowLinkedin(!showLinkedin)}
            className="flex items-center gap-1.5 text-sm font-medium text-[var(--color-primary-light)] hover:text-[var(--color-primary)] transition-colors cursor-pointer"
          >
            <Link2 size={14} />
            {showLinkedin ? 'Hide' : 'Add'} LinkedIn connections
            <span className="text-[var(--color-text-muted)] font-normal text-xs">(find mutual contacts)</span>
          </button>

          {showLinkedin && (
            <div className="mt-3">
              <p className="text-xs text-[var(--color-text-muted)] mb-2">
                LinkedIn → Settings → Data Privacy → Get a copy of your data → Connections.
                Paste the CSV or just list names and companies. Only 1st-degree connections are exported — that's what we need to find warm intros.
              </p>
              <textarea
                value={linkedinConnections}
                onChange={(e) => setLinkedinConnections(e.target.value)}
                placeholder={"First Name,Last Name,Company,Position\nJohn,Doe,Salesforce,Engineering Manager\nJane,Smith,Stripe,Head of AI\n..."}
                rows={4}
                className="w-full px-4 py-3 bg-[var(--color-surface)] border border-[var(--color-border-subtle)] rounded-xl text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/40 focus:border-[var(--color-primary)]/40 transition-all resize-none font-mono text-xs leading-relaxed"
              />
            </div>
          )}
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={!isValid || isLoading}
          className="w-full py-3.5 px-4 rounded-xl font-semibold text-white transition-all cursor-pointer disabled:cursor-not-allowed flex items-center justify-center gap-2 animated-gradient disabled:opacity-40 disabled:animation-none hover:shadow-[0_0_30px_-5px_rgba(37,99,235,0.4)]"
        >
          {isLoading ? (
            <>
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Agents Working...
            </>
          ) : (
            <>
              Find & Reach Out
              <ArrowRight size={16} />
            </>
          )}
        </button>
      </div>
    </form>
  );
}
