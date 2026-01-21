# Calendar Pro - Documentação Técnica Completa

## Visão Geral

Componente de calendário profissional para WeWeb com funcionalidades similares ao Google Calendar. Suporta visualizações de mês, semana e dia, com integração completa ao sistema de agendamentos.

## Estrutura de Arquivos

```
ww-calendarpro/
├── src/
│   ├── wwElement.vue              # Componente principal
│   └── components/
│       ├── MonthView.vue          # Visualização mensal
│       ├── WeekView.vue           # Visualização semanal
│       └── DayView.vue            # Visualização diária
├── ww-config.js                   # Configuração WeWeb
├── package.json
├── README.md
└── CLAUDE.md                      # Esta documentação
```

## Arquitetura

### Componente Principal (wwElement.vue)

**Responsabilidades:**
- Gerenciar estado global do calendário
- Controlar navegação entre períodos
- Processar e enriquecer dados das collections
- Expor variáveis de componente para WeWeb
- Despachar eventos para workflows
- Renderizar views baseado no estado atual

**Props:**
- `content`: Objeto com todas as propriedades configuráveis
- `uid`: ID único do componente
- `wwEditorState`: Estado do editor (apenas em modo editor)

**Estado Local:**
```js
currentDate: ref(new Date())        // Data central do calendário
currentView: ref('month')           // View ativa: 'month', 'week', 'day'
```

**Variáveis de Componente Expostas:**
```js
startDate: string                   // ISO string - início do período visível
endDate: string                     // ISO string - fim do período visível
currentView: string                 // View atual
currentDate: string                 // ISO string - data central
selectedAppointment: object         // Último agendamento clicado
```

### Processamento de Collections

O componente enriquece os agendamentos com dados relacionados:

```js
processedAppointments = agendamentos.map(apt => ({
  ...apt,
  _service: servicos.find(s => s.id === apt.servico_id),
  _professional: profissionais.find(p => p.id === apt.profissional_id),
  _client: clientes.find(c => c.id === apt.cliente_id)
}))
```

**Vantagem:** Views podem acessar dados relacionados sem fazer lookups adicionais.

### Sistema de Paginação

**Abordagem:** Paginação por período de tempo, não por número de itens.

1. **Componente define range de datas:**
   - Month: primeiro ao último dia do mês
   - Week: segunda a domingo da semana
   - Day: 00:00 às 23:59 do dia

2. **Atualiza variáveis expostas:**
   ```js
   setStartDate(start.toISOString())
   setEndDate(end.toISOString())
   ```

3. **WeWeb aplica filtros automaticamente:**
   ```
   Collection Filters:
   - data_inicio >= [variable: uid-startDate]
   - data_inicio <= [variable: uid-endDate]
   ```

4. **Ao navegar (prev/next):**
   - Componente atualiza `startDate` e `endDate`
   - WeWeb refetch automaticamente
   - Sem necessidade de paginação manual

## MonthView.vue

### Layout

Grid 7x6 (7 dias × ~6 semanas) mostrando o mês completo.

**Lógica de Cálculo:**
```js
// Primeiro dia do mês
const firstDay = new Date(year, month, 1)

// Início: Segunda da semana que contém dia 1
const startDate = getStartOfWeek(firstDay)

// Fim: Domingo da semana que contém último dia
const endDate = getEndOfWeek(lastDay)
```

**Conversão de Dias da Semana:**
- Backend: 0 (domingo) a 6 (sábado)
- Frontend: Segunda a Domingo
- Ajuste: `diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek`

### Exibição de Eventos

**Limite por Célula:**
- Máximo 3 eventos visíveis
- Prioridade: agendamentos primeiro, depois bloqueios
- Indicador "+X more" se houver mais eventos

**Estrutura de Evento:**
```vue
<div class="event-item">
  <div class="event-indicator" />    <!-- Barra colorida lateral -->
  <div class="event-content">
    <div class="event-time">9:00 AM</div>
    <div class="event-title">Consulta</div>
    <div class="event-badge">✓</div>  <!-- Status icon -->
  </div>
</div>
```

### Status Visuais

- **Pending**: Círculo vazio (outline)
- **Confirmed**: Checkmark verde
- **Cancelled**: X vermelho + opacity reduzida (0.5)

### Click Handlers

**Click na célula:**
- Se vazia → `emptySlotClick` event
- Passa: `{ date, time: null, timestamp }`

**Click no evento:**
- `appointmentClick` event
- Passa objeto completo do agendamento

## WeekView.vue

### Layout

Grid com:
- 1 coluna de tempo (80px)
- 7 colunas de dias (1fr cada)
- Linhas: slots de tempo baseados em `timeSlotMinutes`

**Estrutura:**
```
┌──────┬─────┬─────┬─────┬─────┬─────┬─────┬─────┐
│ Time │ Mon │ Tue │ Wed │ Thu │ Fri │ Sat │ Sun │
├──────┼─────┼─────┼─────┼─────┼─────┼─────┼─────┤
│ 6 AM │     │     │     │     │     │     │     │
│ 6:30 │     │ ■■■ │     │     │     │     │     │
│ 7 AM │     │ ■■■ │     │     │     │     │     │
...
```

### Cálculo de Slots

```js
timeSlots = []
for (hour = workingHoursStart; hour <= workingHoursEnd; hour++) {
  for (minute = 0; minute < 60; minute += timeSlotMinutes) {
    if (hour === workingHoursEnd && minute > 0) break
    timeSlots.push({ hour, minute, time: 'HH:mm' })
  }
}
```

**Exemplo (6-22h, 30min slots):**
- 6:00, 6:30, 7:00, 7:30, ... 21:30, 22:00
- Total: ~33 slots

### Detecção de Overlap

Para cada slot, verifica quais eventos ocupam aquele horário:

```js
getSlotEvents(day, slot) {
  const slotStart = new Date(day.date)
  slotStart.setHours(slot.hour, slot.minute)
  const slotEnd = new Date(slotStart + timeSlotMinutes)

  return events.filter(event => {
    const eventStart = new Date(event.data_inicio)
    const eventEnd = new Date(event.data_fim)

    // Overlap check
    return (
      (eventStart >= slotStart && eventStart < slotEnd) ||
      (eventEnd > slotStart && eventEnd <= slotEnd) ||
      (eventStart <= slotStart && eventEnd >= slotEnd)
    )
  })
}
```

### Responsividade

**Mobile (<768px):**
- Grid com scroll horizontal
- Min-width: 600px no grid interno
- Coluna de tempo reduzida para 60px
- Font sizes reduzidos

## DayView.vue

### Layout

Similar ao WeekView mas com apenas 1 coluna de dia.

**Vantagens:**
- Mais espaço para detalhes do evento
- Melhor para visualização focada
- Indicador de "hora atual" em tempo real

### Indicador de Hora Atual

**Apenas ativa se:**
1. Data visualizada é hoje
2. Hora atual está dentro do slot

```js
isCurrentTimeSlot(slot) {
  if (!isToday) return false

  const slotStart = slot.hour * 60 + slot.minute
  const slotEnd = slotStart + timeSlotMinutes
  const currentTime = now.getHours() * 60 + now.getMinutes()

  return currentTime >= slotStart && currentTime < slotEnd
}
```

**Visual:**
- Linha horizontal vermelha
- Círculo pequeno no início da linha
- Z-index: 10 (sobre eventos)

### Detalhes Expandidos

DayView mostra mais informações:

```vue
<div class="slot-event">
  <div class="event-header">
    <div class="event-time-range">9:00 AM - 10:00 AM</div>
    <div class="event-status">✓</div>
  </div>
  <div class="event-title">Consulta de Rotina</div>
  <div class="event-details">João Silva • Consultório A</div>
</div>
```

**Detalhes incluem:**
- Nome do cliente
- Nome do serviço (se não houver título)
- Localização
- Separados por "•"

## Sistema de Estilos

### CSS Variables

Todas as cores são injetadas via CSS variables:

```js
containerStyle = {
  '--primary-color': content.primaryColor || '#081B4E',
  '--background-color': content.backgroundColor || '#FFFFFF',
  '--border-color': content.borderColor || '#E5E7EB',
  '--text-color': content.textColor || '#1F2937',
  '--muted-text-color': content.mutedTextColor || '#6B7280',
  '--today-highlight-color': content.todayHighlightColor || '#EFF6FF',
  '--appointment-bg': content.appointmentBackgroundColor || '#DBEAFE',
  '--appointment-text': content.appointmentTextColor || '#1E40AF',
  '--block-bg': content.blockBackgroundColor || '#FEE2E2',
  '--block-text': content.blockTextColor || '#991B1B',
  '--cancelled-opacity': content.cancelledOpacity ?? 0.5,
  '--header-font-size': content.headerFontSize || '16px',
  '--body-font-size': content.bodyFontSize || '14px'
}
```

### Tema Padrão

**Cores:**
- Primary: #081B4E (azul escuro)
- Background: #FFFFFF (branco)
- Border: #E5E7EB (cinza claro)
- Text: #1F2937 (cinza escuro)
- Muted: #6B7280 (cinza médio)

**Agendamentos:**
- Background: #DBEAFE (azul claro)
- Text: #1E40AF (azul escuro)

**Bloqueios:**
- Background: #FEE2E2 (vermelho claro)
- Text: #991B1B (vermelho escuro)

**Elementos:**
- Border radius: 8px (padrão WeWeb)
- Button padding: 6px 12px
- Fonts: 16px (headers), 14px (body)

### Responsividade

**Breakpoints:**
- Desktop: >1024px - Layout completo
- Tablet: 768-1024px - Spacing ajustado
- Mobile: <768px - Layout simplificado

**Ajustes Mobile:**
```scss
@media (max-width: 768px) {
  .calendar-header {
    flex-direction: column;
    align-items: stretch;
  }

  .day-cell {
    min-height: 80px;  // Reduzido de 120px
    padding: 4px;      // Reduzido de 8px
  }

  .event-item {
    font-size: 11px;   // Reduzido de 12px
  }
}
```

## Events e Actions

### Events (Componente → Workflow)

#### 1. appointmentClick
**Quando:** Click em agendamento
**Payload:**
```js
{
  name: 'appointmentClick',
  event: {
    appointment: {...},    // Objeto completo
    appointmentId: 'uuid'
  }
}
```

#### 2. emptySlotClick
**Quando:** Click em horário vazio
**Payload:**
```js
{
  name: 'emptySlotClick',
  event: {
    date: '2026-01-21',           // YYYY-MM-DD
    time: '09:00',                // HH:mm (null em month view)
    timestamp: '2026-01-21T09:00:00.000Z'
  }
}
```

#### 3. dateChange
**Quando:** Navegação de data (prev/next/today)
**Payload:**
```js
{
  name: 'dateChange',
  event: {
    date: '2026-01-21T00:00:00.000Z',
    view: 'month',
    startDate: '2026-01-01T00:00:00.000Z',
    endDate: '2026-01-31T23:59:59.999Z'
  }
}
```

#### 4. viewChange
**Quando:** Mudança de visualização
**Payload:**
```js
{
  name: 'viewChange',
  event: {
    view: 'week',
    previousView: 'month'
  }
}
```

### Actions (Workflow → Componente)

#### 1. goToToday()
Navega para hoje.

#### 2. goToDate(dateString)
**Parâmetro:** ISO date string ou qualquer formato parseável
**Exemplo:** `'2026-12-25'`, `'2026-12-25T10:00:00Z'`

#### 3. changeView(view)
**Parâmetro:** `'month'`, `'week'`, ou `'day'`

#### 4. nextPeriod()
Avança um período (mês/semana/dia).

#### 5. previousPeriod()
Retrocede um período.

**Implementação:**
```js
setup(props, { emit }) {
  const goToToday = () => {
    if (isEditing.value) return
    currentDate.value = new Date()
    updateDateRange()
  }

  // ... outras actions

  return {
    goToToday,
    goToDate,
    changeView,
    nextPeriod,
    previousPeriod
  }
}
```

## Boas Práticas Implementadas

### 1. Código Defensivo

**Validação de dados bindable:**
```js
const processedAppointments = computed(() => {
  const appointments = props.content.agendamentos || []
  if (!Array.isArray(appointments)) return []

  return appointments
    .map(apt => {
      if (!apt) return null
      // Processar...
    })
    .filter(apt => apt != null)
})
```

### 2. Performance

**Computed properties para cálculos pesados:**
```js
const calendarDays = computed(() => {
  // Cálculo complexo de dias do mês
  // Cacheia automaticamente
})
```

**Limit de eventos visíveis:**
```js
.slice(0, 3)  // MonthView: máximo 3 eventos por dia
```

### 3. Detecção de Modo Editor

**Sempre verificar antes de executar ações:**
```js
const handleClick = () => {
  if (isEditing.value) return  // Não executar no editor
  emit('trigger-event', {...})
}
```

### 4. Acessibilidade

```vue
<button
  aria-label="Previous"
  :disabled="someCondition"
  @click="handlePrevious"
>
  ‹
</button>
```

### 5. Fallbacks de Dados

**Título do agendamento:**
```js
getAppointmentTitle(apt) {
  if (apt.titulo) return apt.titulo
  if (apt._service?.nome_servico) return apt._service.nome_servico
  if (apt.nome_cliente) return apt.nome_cliente
  if (apt._client?.nome) return apt._client.nome
  return 'Appointment'  // Fallback final
}
```

## Troubleshooting

### Problema: Collections não carregam

**Causa:** Filtros de data não configurados
**Solução:** Configurar filtros na collection:
```
data_inicio >= [variable: uid-startDate]
data_inicio <= [variable: uid-endDate]
```

### Problema: Eventos não aparecem

**Causa:** Formato de data incorreto
**Solução:** Garantir que `data_inicio` é ISO timestamp:
```
2026-01-21T09:00:00.000Z  ✓
2026-01-21                ✗ (falta hora)
```

### Problema: Sobreposição de eventos

**Causa:** WeekView/DayView espera `data_fim`
**Solução:** Se `data_fim` for null, usa duração padrão:
```js
const aptEnd = apt.data_fim
  ? new Date(apt.data_fim)
  : new Date(aptStart.getTime() + 30 * 60000)  // +30min
```

### Problema: Calendário não atualiza ao navegar

**Causa:** `updateDateRange()` não chamado
**Solução:** Verificar watchers e handlers de navegação:
```js
watch(currentView, () => {
  updateDateRange()
})
```

## Extensões Futuras

### Drag & Drop
Para adicionar movimentação de agendamentos:
1. Adicionar `@dragstart` e `@drop` handlers
2. Calcular nova data/hora baseado no drop target
3. Emitir evento `appointmentMove` com novo timestamp
4. Workflow atualiza no banco de dados

### Multi-profissional
Para suportar múltiplos profissionais lado a lado:
1. Adicionar prop `showMultipleProfessionals`
2. WeekView/DayView renderiza coluna por profissional
3. Grid: `80px + N×1fr` (N = número de profissionais)
4. Filtrar eventos por profissional em cada coluna

### Criação Inline
Para criar agendamento direto no calendário:
1. Double-click em slot vazio
2. Mostrar form inline
3. Salvar sem workflow
4. Emitir evento `appointmentCreated`

### Zoom de Horário
Para ajustar altura dos slots:
1. Adicionar prop `timeSlotHeight`
2. Calcular altura: `height = timeSlotHeight * (60 / timeSlotMinutes)`
3. Scroll automático para hora atual

## Manutenção

### Adicionar Nova Propriedade

1. **ww-config.js:**
```js
properties: {
  novaPropriedade: {
    label: { en: 'Nova Propriedade' },
    type: 'Text',
    defaultValue: 'valor',
    section: 'settings'
  }
}
```

2. **wwElement.vue:**
```js
const novaPropriedade = computed(() =>
  props.content.novaPropriedade || 'valor'
)
```

3. **Passar para view:**
```js
<MonthView :nova-propriedade="novaPropriedade" />
```

### Adicionar Novo Event

1. **ww-config.js:**
```js
triggerEvents: [
  {
    name: 'novoEvento',
    label: { en: 'Novo Evento' },
    event: { campo: 'valor' }
  }
]
```

2. **Componente:**
```js
emit('trigger-event', {
  name: 'novoEvento',
  event: { campo: valor }
})
```

### Adicionar Nova Action

1. **ww-config.js:**
```js
actions: [
  {
    label: { en: 'Nova Ação' },
    action: 'novaAcao',
    args: [{ name: 'param', type: 'string' }]
  }
]
```

2. **Componente:**
```js
const novaAcao = (param) => {
  if (isEditing.value) return
  // Lógica
}

return { novaAcao }  // Expor no return
```

## Conclusão

Este componente implementa um calendário completo seguindo todos os padrões WeWeb:
- ✓ Vue 3 Composition API
- ✓ Variáveis de componente expostas
- ✓ Events para workflows
- ✓ Actions controladas externamente
- ✓ Propriedades bindable e responsivas
- ✓ Código defensivo e performático
- ✓ Design system consistente
- ✓ Mobile-first responsive

Pronto para uso em produção.
