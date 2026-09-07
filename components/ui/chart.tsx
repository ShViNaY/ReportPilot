'use client';

import * as React from 'react';
import * as RechartsPrimitive from 'recharts';

import { cn } from '@/lib/utils';

// Format: { THEME_NAME: CSS_SELECTOR }
const THEMES = { light: '', dark: '.dark' } as const;

export type ChartConfig = {
  [k in string]: {
    label?: React.ReactNode;
    icon?: React.ComponentType;
  } & (
    | { color?: string; theme?: never }
    | { color?: never; theme: Record<keyof typeof THEMES, string> }
  );
};

type ChartContextProps = {
  config: ChartConfig;
};

const ChartContext = React.createContext<ChartContextProps | null>(null);

function useChart() {
  const context = React.useContext(ChartContext);

  if (!context) {
    throw new Error('useChart must be used within a <ChartContainer />');
  }

  return context;
}

const ChartContainer = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<'div'> & {
    config: ChartConfig;
    children: React.ComponentProps<
      typeof RechartsPrimitive.ResponsiveContainer
    >['children'];
  }
>(({ id, className, children, config, ...props }, ref) => {
  const uniqueId = React.useId();
  const chartId = `chart-${id || uniqueId.replace(/:/g, '')}`;
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <ChartContext.Provider value={{ config }}>
      <div
        data-chart={chartId}
        ref={ref}
        className={cn(
          "w-full h-[320px] min-h-[300px] text-xs [&_.recharts-cartesian-axis-tick_text]:fill-zinc-500 [&_.recharts-cartesian-grid_line]:stroke-zinc-800/60 [&_.recharts-curve.recharts-tooltip-cursor]:stroke-zinc-700 [&_.recharts-dot[stroke='#fff']]:stroke-transparent [&_.recharts-layer]:outline-none [&_.recharts-polar-grid]:stroke-zinc-800 [&_.recharts-radial-bar-background-sector]:fill-zinc-900 [&_.recharts-rectangle.recharts-tooltip-cursor]:fill-zinc-800/40 [&_.recharts-reference-line]:stroke-zinc-800 [&_.recharts-sector[stroke='#fff']]:stroke-transparent [&_.recharts-sector]:outline-none [&_.recharts-surface]:outline-none",
          className
        )}
        {...props}
      >
        <ChartStyle id={chartId} config={config} />
        {mounted ? (
          <RechartsPrimitive.ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={300}>
            {children}
          </RechartsPrimitive.ResponsiveContainer>
        ) : (
          <div className="w-full h-[320px] min-h-[300px] animate-pulse bg-zinc-900/50 rounded-xl" />
        )}
      </div>
    </ChartContext.Provider>
  );
});
ChartContainer.displayName = 'Chart';

const ChartStyle = ({ id, config }: { id: string; config: ChartConfig }) => {
  const colorConfig = Object.entries(config).filter(
    ([, config]) => config.theme || config.color
  );

  if (!colorConfig.length) {
    return null;
  }

  return (
    <style
      dangerouslySetInnerHTML={{
        __html: Object.entries(THEMES)
          .map(
            ([theme, prefix]) => `
${prefix} [data-chart=${id}] {
${colorConfig
  .map(([key, itemConfig]) => {
    const color =
      itemConfig.theme?.[theme as keyof typeof itemConfig.theme] ||
      itemConfig.color;
    return color ? `  --color-${key}: ${color};` : null;
  })
  .filter(Boolean)
  .join('\n')}
}
`
          )
          .join('\n'),
      }}
    />
  );
};

const ChartTooltip = RechartsPrimitive.Tooltip;

export interface ChartTooltipContentProps extends React.ComponentProps<'div'> {
  active?: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  payload?: any[];
  className?: string;
  indicator?: 'line' | 'dot' | 'dashed';
  hideLabel?: boolean;
  hideIndicator?: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  label?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  labelFormatter?: (value: any, payload: any[]) => React.ReactNode;
  labelClassName?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  formatter?: (value: any, name: any, item: any, index: number, payload: any) => React.ReactNode;
  color?: string;
  nameKey?: string;
  labelKey?: string;
}

const ChartTooltipContent = React.forwardRef<
  HTMLDivElement,
  ChartTooltipContentProps
>(
  (
    {
      active,
      payload,
      className,
      indicator = 'dot',
      hideLabel = false,
      hideIndicator = false,
      label,
      labelFormatter,
      labelClassName,
      formatter,
      color,
      nameKey,
      labelKey,
    },
    ref
  ) => {
    const { config } = useChart();

    const tooltipLabel = React.useMemo(() => {
      if (hideLabel || !payload?.length) {
        return null;
      }

      const [item] = payload;
      const key = `${labelKey || item?.dataKey || item?.name || 'value'}`;
      const itemConfig = getPayloadConfigFromPayload(config, item, key);
      const value =
        !labelKey && typeof label === 'string'
          ? config[label as keyof typeof config]?.label || label
          : itemConfig?.label;

      if (labelFormatter) {
        return (
          <div className={cn('font-semibold text-zinc-200', labelClassName)}>
            {labelFormatter(value, payload)}
          </div>
        );
      }

      if (!value) {
        return null;
      }

      return (
        <div className={cn('font-semibold text-zinc-200', labelClassName)}>
          {value}
        </div>
      );
    }, [
      label,
      labelFormatter,
      payload,
      hideLabel,
      labelClassName,
      config,
      labelKey,
    ]);

    if (!active || !payload?.length) {
      return null;
    }

    const nestLabel = payload.length === 1 && indicator !== 'dot';

    return (
      <div
        ref={ref}
        className={cn(
          'grid min-w-[8.5rem] items-start gap-1.5 rounded-xl border border-zinc-800 bg-[#18181b] px-3.5 py-2.5 text-xs shadow-xl text-zinc-100',
          className
        )}
      >
        {!nestLabel ? tooltipLabel : null}
        <div className="grid gap-1.5">
          {payload
            .filter((item: any) => item && item.type !== 'none')
            .map((item: any, index: number) => {
              const key = `${nameKey || item.name || item.dataKey || 'value'}`;
              const itemConfig = getPayloadConfigFromPayload(config, item, key);
              const indicatorColor = color || (item.payload as { fill?: string })?.fill || item.color;

              return (
                <div
                  key={item.dataKey || index}
                  className={cn(
                    'flex w-full flex-wrap items-stretch gap-2 [&>svg]:h-2.5 [&>svg]:w-2.5 [&>svg]:text-zinc-500',
                    indicator === 'dot' && 'items-center'
                  )}
                >
                  {formatter && item?.value !== undefined && item.name ? (
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    formatter(item.value, item.name, item as any, index, item.payload)
                  ) : (
                    <>
                      {itemConfig?.icon ? (
                        <itemConfig.icon />
                      ) : (
                        !hideIndicator && (
                          <div
                            className={cn(
                              'shrink-0 rounded-[2px]',
                              {
                                'h-2.5 w-2.5 rounded-full': indicator === 'dot',
                                'w-1 rounded-sm': indicator === 'line',
                                'w-0 border-[1.5px] border-dashed bg-transparent':
                                   indicator === 'dashed',
                                'my-0.5': nestLabel && indicator === 'dashed',
                              }
                            )}
                            style={{
                              backgroundColor: indicatorColor,
                              borderColor: indicatorColor,
                            }}
                          />
                        )
                      )}
                      <div
                        className={cn(
                          'flex flex-1 justify-between gap-3 leading-none',
                          nestLabel ? 'items-end' : 'items-center'
                        )}
                      >
                        <div className="grid gap-1">
                          {nestLabel ? tooltipLabel : null}
                          <span className="text-zinc-400 font-medium">
                            {itemConfig?.label || item.name}
                          </span>
                        </div>
                        {item.value !== undefined && (
                          <span className="font-mono font-semibold tabular-nums text-zinc-100">
                            {typeof item.value === 'number'
                              ? item.value.toLocaleString()
                              : item.value}
                          </span>
                        )}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
        </div>
      </div>
    );
  }
);
ChartTooltipContent.displayName = 'ChartTooltip';

const ChartLegend = RechartsPrimitive.Legend;

export interface ChartLegendContentProps extends React.ComponentProps<'div'> {
  className?: string;
  hideIcon?: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  payload?: any[];
  verticalAlign?: 'top' | 'middle' | 'bottom';
  nameKey?: string;
}

const ChartLegendContent = React.forwardRef<
  HTMLDivElement,
  ChartLegendContentProps
>(
  (
    { className, hideIcon = false, payload, verticalAlign = 'bottom', nameKey },
    ref
  ) => {
    const { config } = useChart();

    if (!payload?.length) {
      return null;
    }

    return (
      <div
        ref={ref}
        className={cn(
          'flex items-center justify-center gap-4 text-xs',
          verticalAlign === 'top' ? 'pb-3' : 'pt-3',
          className
        )}
      >
        {payload
          .filter((item: any) => item && item.type !== 'none')
          .map((item: any) => {
            const key = `${nameKey || item.dataKey || 'value'}`;
            const itemConfig = getPayloadConfigFromPayload(config, item, key);

            return (
              <div
                key={item.value}
                className={cn(
                  'flex items-center gap-1.5 font-medium text-zinc-400 [&>svg]:h-3 [&>svg]:w-3 [&>svg]:text-zinc-500'
                )}
              >
                {itemConfig?.icon && !hideIcon ? (
                  <itemConfig.icon />
                ) : (
                  <div
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{
                      backgroundColor: item.color,
                    }}
                  />
                )}
                <span>{itemConfig?.label || item.value}</span>
              </div>
            );
          })}
      </div>
    );
  }
);
ChartLegendContent.displayName = 'ChartLegend';

// Helper to extract item config from a payload.
function getPayloadConfigFromPayload(
  config: ChartConfig,
  payload: unknown,
  key: string
) {
  if (typeof payload !== 'object' || payload === null) {
    return undefined;
  }

  const payloadPayload =
    'payload' in payload &&
    typeof payload.payload === 'object' &&
    payload.payload !== null
      ? payload.payload
      : undefined;

  let configLabelKey: string = key;

  if (
    key in payload &&
    typeof payload[key as keyof typeof payload] === 'string'
  ) {
    configLabelKey = payload[key as keyof typeof payload] as string;
  } else if (
    payloadPayload &&
    key in payloadPayload &&
    typeof payloadPayload[key as keyof typeof payloadPayload] === 'string'
  ) {
    configLabelKey = payloadPayload[
      key as keyof typeof payloadPayload
    ] as string;
  }

  return configLabelKey in config
    ? config[configLabelKey]
    : config[key as keyof typeof config];
}

export {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  ChartStyle,
};
