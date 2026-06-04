import { useState } from 'react';
import { ArrowRight, Building2, FileText, Link2, Link, Mail, Target, User } from 'lucide-react';
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
  const [linkedinFileName, setLinkedinFileName] = useState('');
  const [showLinkedin, setShowLinkedin] = useState(false);
  const [jobUrl, setJobUrl] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [showJobDesc, setShowJobDesc] = useState(false);
  const [showJobPaste, setShowJobPaste] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      company,
      resume_text: resumeText,
      goal,
      sender_name: senderName,
      sender_email: senderEmail,
      linkedin_connections: linkedinConnections,
      job_url: jobUrl,
      job_description: jobDescription,
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

        {/* Job Posting — URL primary, paste fallback */}
        <div>
          <button
            type="button"
            onClick={() => setShowJobDesc(!showJobDesc)}
            className="flex items-center gap-1.5 text-sm font-medium text-[var(--color-primary-light)] hover:text-[var(--color-primary)] transition-colors cursor-pointer"
          >
            <Link size={14} />
            {showJobDesc ? 'Hide' : 'Add'} job posting
            <span className="text-[var(--color-text-muted)] font-normal text-xs">(emails target the actual role)</span>
          </button>

          {showJobDesc && (
            <div className="mt-3 space-y-3">
              <div>
                <label className="flex items-center gap-1.5 text-xs font-medium text-[var(--color-text-secondary)] mb-1.5">
                  <Link size={12} />
                  Job posting URL
                </label>
                <input
                  type="url"
                  value={jobUrl}
                  onChange={(e) => setJobUrl(e.target.value)}
                  placeholder="https://jobs.adobe.com/job/123456"
                  className="w-full px-4 py-3 bg-[var(--color-surface)] border border-[var(--color-border-subtle)] rounded-xl text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/40 focus:border-[var(--color-primary)]/40 transition-all text-sm"
                />
              </div>

              <div>
                <button
                  type="button"
                  onClick={() => setShowJobPaste(!showJobPaste)}
                  className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] transition-colors cursor-pointer"
                >
                  {showJobPaste ? '▾' : '▸'} or paste description manually
                </button>

                {showJobPaste && (
                  <textarea
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    placeholder="Paste job description here..."
                    rows={4}
                    className="mt-2 w-full px-4 py-3 bg-[var(--color-surface)] border border-[var(--color-border-subtle)] rounded-xl text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/40 focus:border-[var(--color-primary)]/40 transition-all resize-none leading-relaxed text-sm"
                  />
                )}
              </div>
            </div>
          )}
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
                LinkedIn → Me → Settings &amp; Privacy → Data Privacy → Get a copy of your data → select Connections → Request archive. Upload the <span className="font-mono">Connections.csv</span> file here.
              </p>
              <label className="flex items-center gap-3 w-full px-4 py-3 bg-[var(--color-surface)] border border-dashed border-[var(--color-border-subtle)] rounded-xl cursor-pointer hover:border-[var(--color-primary)]/40 transition-all">
                <Link2 size={16} className="text-[var(--color-text-muted)] shrink-0" />
                <span className="text-sm text-[var(--color-text-muted)] truncate">
                  {linkedinFileName || 'Choose Connections.csv…'}
                </span>
                {linkedinFileName && (
                  <button
                    type="button"
                    onClick={(e) => { e.preventDefault(); setLinkedinConnections(''); setLinkedinFileName(''); }}
                    className="ml-auto text-[var(--color-text-muted)] hover:text-red-400 transition-colors shrink-0"
                  >
                    ✕
                  </button>
                )}
                <input
                  type="file"
                  accept=".csv,text/csv"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    setLinkedinFileName(file.name);
                    const reader = new FileReader();
                    reader.onload = (ev) => setLinkedinConnections((ev.target?.result as string) || '');
                    reader.readAsText(file);
                  }}
                />
              </label>
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
