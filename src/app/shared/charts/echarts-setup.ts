import * as echarts from 'echarts/core';
import { BarChart, LineChart, PieChart, RadarChart } from 'echarts/charts';
import { AriaComponent, DatasetComponent, GridComponent, LegendComponent, MarkLineComponent, MarkPointComponent, TitleComponent, TooltipComponent } from 'echarts/components';
import { LegacyGridContainLabel } from 'echarts/features';
import { CanvasRenderer } from 'echarts/renderers';

// Só os módulos do ECharts que a documentação usa; este arquivo só é importado pelo gráfico
// (chunk carregado sob demanda), então o pacote inicial não leva a biblioteca.
echarts.use([
  BarChart, LineChart, PieChart, RadarChart,
  AriaComponent, DatasetComponent, GridComponent, LegendComponent, MarkLineComponent, MarkPointComponent, TitleComponent, TooltipComponent,
  LegacyGridContainLabel, CanvasRenderer
]);

export { echarts };
