import { ExternalLink, Linkedin, Mail, User } from 'lucide-react';
import type { Contact } from '../types';

interface ContactCardProps {
  contact: Contact;
}

export function ContactCard({ contact }: ContactCardProps) {
  return (
    <div className="rounded-2xl bg-[var(--color-surface-raised)] border border-[var(--color-border-subtle)] p-6 gradient-border">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-[var(--color-primary)]/10 flex items-center justify-center shrink-0">
            <User size={20} className="text-[var(--color-primary-light)]" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">{contact.name}</h3>
            <p className="text-sm text-[var(--color-text-secondary)] mt-0.5">{contact.title}</p>

            <div className="flex items-center gap-4 mt-3">
              {contact.email && (
                <div className="flex items-center gap-1.5 text-sm text-[var(--color-primary-light)]">
                  <Mail size={13} />
                  {contact.email}
                </div>
              )}
              {contact.linkedin_url && (
                <a
                  href={contact.linkedin_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-sm text-[var(--color-primary-light)] hover:text-[var(--color-primary)] transition-colors"
                >
                  <Linkedin size={13} />
                  LinkedIn
                  <ExternalLink size={11} />
                </a>
              )}
            </div>
          </div>
        </div>

        {contact.relevance_score > 0 && (
          <div className="text-right shrink-0">
            <div className="text-2xl font-bold text-[var(--color-primary-light)]">
              {Math.round(contact.relevance_score * 100)}%
            </div>
            <div className="text-xs text-[var(--color-text-muted)]">match</div>
          </div>
        )}
      </div>

      {contact.relevance_reason && (
        <p className="text-xs text-[var(--color-text-muted)] mt-4 pt-4 border-t border-[var(--color-border-subtle)] leading-relaxed">
          {contact.relevance_reason}
        </p>
      )}
    </div>
  );
}
