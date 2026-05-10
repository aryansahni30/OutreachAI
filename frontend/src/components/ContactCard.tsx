import type { Contact } from '../types';

interface ContactCardProps {
  contact: Contact;
}

export function ContactCard({ contact }: ContactCardProps) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
      <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wide mb-3">
        Target Contact
      </h3>
      <div className="space-y-2">
        <div>
          <p className="text-lg font-semibold text-white">{contact.name}</p>
          <p className="text-sm text-zinc-400">{contact.title}</p>
        </div>
        {contact.email && (
          <p className="text-sm text-blue-400">{contact.email}</p>
        )}
        {contact.linkedin_url && (
          <a
            href={contact.linkedin_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-blue-400 hover:text-blue-300 underline"
          >
            LinkedIn Profile
          </a>
        )}
        {contact.relevance_reason && (
          <p className="text-xs text-zinc-500 mt-2 pt-2 border-t border-zinc-800">
            {contact.relevance_reason}
          </p>
        )}
      </div>
    </div>
  );
}
