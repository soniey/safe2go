const stages = ['Detect', 'Assess', 'Predict', 'Verify', 'Prioritise', 'Respond', 'Resolve'];

export default function ResilienceWorkflow() {
  return (
    <aside className="mt-6 border-t border-neutral-200 pt-4" aria-label="Intended platform workflow">
      <p className="text-xs text-neutral-500">
        <span className="font-medium">Platform workflow: </span>
        {stages.join(' → ')}
      </p>
    </aside>
  );
}
