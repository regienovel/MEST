'use client';
import { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, BookOpen } from 'lucide-react';

interface Scenario {
  title: string;
  year: number;
  location: string;
  industry: string;
  headline: string;
  executive_summary: string;
  the_failure: {
    what_went_wrong: string;
    who_was_harmed: string;
    the_root_cause: string;
  };
  the_lesson: {
    trust_property_violated: string;
    rebuild_techniques: string[];
    why_it_matters_for_african_builders: string;
  };
  discussion_questions: string[];
}

export function ScenarioBrief() {
  const [scenario, setScenario] = useState<Scenario | null>(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    fetch('/api/rag/scenario')
      .then(r => r.json())
      .then(d => { if (d.scenario) setScenario(d.scenario); })
      .catch(() => {});
  }, []);

  if (!scenario) return null;

  const trustLabels: Record<string, string> = {
    honest_uncertainty: 'Honest Uncertainty',
    source_citation: 'Source Citation',
    context_fit: 'Context Fit',
    recoverability: 'Recoverability',
    adversarial_robustness: 'Adversarial Robustness',
  };

  return (
    <div className="bg-gradient-to-r from-mest-blue-light to-mest-teal-light rounded-xl border border-mest-blue/20 overflow-hidden mb-6">
      {/* Header — always visible */}
      <div className="px-5 py-4">
        <div className="flex items-start gap-3">
          <BookOpen size={20} className="text-mest-blue mt-0.5 shrink-0" />
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-serif text-lg text-mest-ink">{scenario.title}</h3>
              <span className="text-xs bg-mest-blue/10 text-mest-blue px-2 py-0.5 rounded-full">{scenario.year} · {scenario.location}</span>
            </div>
            <p className="text-sm text-mest-grey-700 leading-relaxed">{scenario.executive_summary}</p>
          </div>
        </div>

        {/* Discussion questions */}
        <div className="mt-3 pl-8">
          <p className="text-xs font-semibold text-mest-blue mb-1.5">Discussion Questions:</p>
          <ul className="space-y-1">
            {scenario.discussion_questions.map((q, i) => (
              <li key={i} className="text-xs text-mest-grey-700 flex gap-2">
                <span className="text-mest-gold font-bold shrink-0">{i + 1}.</span>
                <span>{q}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Expand/collapse */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-3 flex items-center gap-1.5 text-xs text-mest-blue hover:text-mest-blue/80 font-medium pl-8"
        >
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          {expanded ? 'Hide full brief' : 'Read full brief'}
        </button>
      </div>

      {/* Expanded content */}
      {expanded && (
        <div className="border-t border-mest-blue/10 px-5 py-4 space-y-4 bg-white/50">
          {/* The Failure */}
          <div>
            <h4 className="text-sm font-semibold text-mest-ink mb-2">What went wrong</h4>
            <p className="text-sm text-mest-grey-700 whitespace-pre-line leading-relaxed">{scenario.the_failure.what_went_wrong}</p>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-mest-rust mb-2">Who was harmed</h4>
            <p className="text-sm text-mest-grey-700 whitespace-pre-line leading-relaxed">{scenario.the_failure.who_was_harmed}</p>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-mest-ink mb-2">Root cause</h4>
            <p className="text-sm text-mest-grey-700 leading-relaxed">{scenario.the_failure.the_root_cause}</p>
          </div>

          {/* The Lesson */}
          <div className="bg-mest-gold-light rounded-lg p-4">
            <h4 className="text-sm font-semibold text-mest-gold mb-2">The lesson</h4>
            <p className="text-xs mb-2">
              <span className="font-semibold">Trust property violated:</span>{' '}
              <span className="bg-mest-gold/20 px-2 py-0.5 rounded">{trustLabels[scenario.the_lesson.trust_property_violated] || scenario.the_lesson.trust_property_violated}</span>
            </p>
            <p className="text-xs mb-2">
              <span className="font-semibold">Rebuild techniques:</span>{' '}
              {scenario.the_lesson.rebuild_techniques.map(t => (
                <span key={t} className="inline-block bg-white/60 text-mest-grey-700 px-1.5 py-0.5 rounded text-xs mr-1 mb-1">{t}</span>
              ))}
            </p>
            <p className="text-sm text-mest-grey-700 italic mt-2">{scenario.the_lesson.why_it_matters_for_african_builders}</p>
          </div>
        </div>
      )}
    </div>
  );
}
