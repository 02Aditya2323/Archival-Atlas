interface AuthorityStat {
  label: string;
  value: string;
  note: string;
}

interface AuthorityStripProps {
  stats: AuthorityStat[];
}

export function AuthorityStrip({ stats }: AuthorityStripProps) {
  return (
    <section className="px-4 md:px-6 lg:px-8">
      <div className="gateway-panel mx-auto max-w-[1560px] rounded-[2rem] border border-white/10 px-5 py-4 md:px-8">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="rounded-[1.4rem] border border-white/8 bg-[rgba(255,250,243,0.04)] px-4 py-4"
            >
              <p className="text-xs font-semibold tracking-[0.22em] text-[#b39a6a] uppercase">
                {stat.label}
              </p>
              <p className="mt-3 font-display text-3xl text-[#f5eddc]">{stat.value}</p>
              <p className="mt-2 text-sm leading-6 text-[#c9baa1]">{stat.note}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
