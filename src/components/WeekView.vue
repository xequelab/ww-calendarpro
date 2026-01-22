<template>
  <div class="week-view">
    <!-- Coluna de horários + Cabeçalhos dos dias -->
    <div class="week-header">
      <div class="time-column-header"></div>
      <div
        v-for="day in weekDays"
        :key="day.dateString"
        class="day-header"
        :class="{ 'today': day.isToday }"
        :style="getDayHeaderStyle(day)"
      >
        <div class="day-name" :style="dayNameStyle">{{ day.dayName }}</div>
        <div class="day-date" :style="dayDateStyle(day)">{{ day.date.getDate() }}</div>
      </div>
    </div>

    <!-- Grade de horários -->
    <div class="week-grid-container">
      <!-- Coluna de rótulos de horário -->
      <div class="time-labels">
        <div
          v-for="hour in hours"
          :key="hour"
          class="time-label"
          :style="timeLabelStyle"
        >
          {{ formatHour(hour) }}
        </div>
      </div>

      <!-- Grade de dias -->
      <div class="days-grid">
        <div
          v-for="day in weekDays"
          :key="day.dateString"
          class="day-column"
          :style="dayColumnStyle"
        >
          <!-- Slots de horário -->
          <div
            v-for="slot in timeSlots"
            :key="slot.time"
            class="time-slot"
            :style="getTimeSlotStyle(slot)"
            @click="handleSlotClick(day, slot)"
          >
            <!-- Eventos do slot -->
            <div
              v-for="event in getSlotEvents(day, slot)"
              :key="event.id"
              class="slot-event has-tooltip"
              :class="{
                'appointment': event.type === 'appointment',
                'block': event.type === 'block',
                'cancelled': event.type === 'appointment' && event.data.status === 'cancelled'
              }"
              :style="getEventStyle(event)"
              @click.stop="handleEventClick(event)"
            >
              <div class="custom-tooltip" v-html="getEventTooltipHTML(event)"></div>
              <div class="event-indicator" :style="getEventIndicatorStyle(event)"></div>
              <div class="event-content-week">
                <div class="event-time-range" :style="eventTextStyle(event)">
                  {{ formatTime(event.data.data_inicio) }}
                </div>
                <div class="event-title" :style="eventTextStyle(event)">
                  {{ getEventTitle(event) }}
                </div>
                <div v-if="event.type === 'appointment'" class="event-status">
                  <div v-if="event.data.status === 'pending'" class="status-badge pending">
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                      <circle cx="5" cy="5" r="4" stroke="currentColor" stroke-width="1.5" fill="none"/>
                    </svg>
                  </div>
                  <div v-else-if="event.data.status === 'confirmed'" class="status-badge confirmed">
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                      <path d="M2 5L4 7L8 3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                  </div>
                  <div v-else-if="event.data.status === 'cancelled'" class="status-badge cancelled">
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                      <path d="M2 2L8 8M8 2L2 8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { computed } from 'vue';

export default {
  name: 'WeekView',
  props: {
    currentDate: {
      type: Date,
      required: true
    },
    appointments: {
      type: Array,
      default: () => []
    },
    blocks: {
      type: Array,
      default: () => []
    },
    workingHoursStart: {
      type: Number,
      default: 6
    },
    workingHoursEnd: {
      type: Number,
      default: 22
    },
    timeSlotMinutes: {
      type: Number,
      default: 30
    },
    styles: {
      type: Object,
      required: true
    }
  },
  emits: ['appointment-click', 'empty-slot-click'],
  setup(props, { emit }) {
    const dayNames = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

    // Get start of week (Monday)
    const getStartOfWeek = (date) => {
      const d = new Date(date);
      const day = d.getDay();
      const diff = day === 0 ? -6 : 1 - day;
      d.setDate(d.getDate() + diff);
      d.setHours(0, 0, 0, 0);
      return d;
    };

    const weekDays = computed(() => {
      const startOfWeek = getStartOfWeek(props.currentDate);
      const days = [];
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      for (let i = 0; i < 7; i++) {
        const date = new Date(startOfWeek);
        date.setDate(date.getDate() + i);
        const dateString = date.toISOString().split('T')[0];
        const isToday = date.getTime() === today.getTime();

        days.push({
          date,
          dateString,
          dayName: dayNames[i],
          isToday
        });
      }

      return days;
    });

    const hours = computed(() => {
      const hrs = [];
      for (let h = props.workingHoursStart; h <= props.workingHoursEnd; h++) {
        hrs.push(h);
      }
      return hrs;
    });

    const timeSlots = computed(() => {
      const slots = [];
      const slotsPerHour = 60 / props.timeSlotMinutes;

      for (let h = props.workingHoursStart; h <= props.workingHoursEnd; h++) {
        for (let m = 0; m < 60; m += props.timeSlotMinutes) {
          if (h === props.workingHoursEnd && m > 0) break;

          slots.push({
            hour: h,
            minute: m,
            time: `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
          });
        }
      }

      return slots;
    });

    // Styles
    const getDayHeaderStyle = (day) => ({
      backgroundColor: day.isToday ? props.styles.todayHighlightColor : 'transparent',
      border: `1px solid ${props.styles.borderColor}`,
      borderRadius: '8px'
    });

    const dayNameStyle = computed(() => ({
      fontSize: props.styles.bodyFontSize,
      color: props.styles.mutedTextColor
    }));

    const dayDateStyle = (day) => ({
      fontSize: props.styles.headerFontSize,
      color: day.isToday ? props.styles.primaryColor : props.styles.textColor,
      fontWeight: day.isToday ? '700' : '600'
    });

    const timeLabelStyle = computed(() => ({
      fontSize: props.styles.bodyFontSize,
      color: props.styles.mutedTextColor
    }));

    const dayColumnStyle = computed(() => ({
      borderRight: `1px solid ${props.styles.borderColor}`
    }));

    const getTimeSlotStyle = (slot) => ({
      borderBottom: `1px solid ${props.styles.borderColor}`,
      minHeight: '60px'
    });

    const getEventStyle = (event) => {
      if (event.type === 'block') {
        return {
          backgroundColor: props.styles.blockBg,
          color: props.styles.blockText,
          border: `1px solid ${props.styles.blockText}20`,
          borderRadius: '8px',
          opacity: 1
        };
      }

      const style = {
        backgroundColor: props.styles.appointmentBg,
        color: props.styles.appointmentText,
        border: `1px solid ${props.styles.appointmentText}20`,
        borderRadius: '8px'
      };

      if (event.data.status === 'cancelled') {
        style.opacity = props.styles.cancelledOpacity;
      }

      return style;
    };

    const getEventIndicatorStyle = (event) => {
      if (event.type === 'block') {
        return {
          backgroundColor: props.styles.blockText,
          width: '3px',
          minWidth: '3px',
          borderRadius: '2px',
          alignSelf: 'stretch'
        };
      }

      return {
        backgroundColor: props.styles.appointmentText,
        width: '3px',
        minWidth: '3px',
        borderRadius: '2px',
        alignSelf: 'stretch'
      };
    };

    const eventTextStyle = (event) => ({
      fontSize: props.styles.bodyFontSize
    });

    // Utility functions
    const formatHour = (hour) => {
      return `${String(hour).padStart(2, '0')}:00`;
    };

    const formatTime = (dateString) => {
      if (!dateString) return '';
      const date = new Date(dateString);
      return date.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
    };

    const getEventTitle = (event) => {
      if (event.type === 'block') {
        return event.data.motivo || 'Bloqueado';
      }

      const apt = event.data;
      if (apt.titulo) return apt.titulo;
      if (apt._service?.nome_servico) return apt._service.nome_servico;
      if (apt.nome_cliente) return apt.nome_cliente;
      if (apt._client?.nome) return apt._client.nome;
      return 'Agendamento';
    };

    const getEventTooltipHTML = (event) => {
      if (event.type === 'block') {
        let html = `<div class="tooltip-title">🚫 Bloqueio</div>`;

        if (event.data.motivo) {
          html += `<div class="tooltip-info">${event.data.motivo}</div>`;
        }

        if (event.data.data_inicio) {
          const start = formatTime(event.data.data_inicio);
          const end = event.data.data_fim ? formatTime(event.data.data_fim) : '';
          html += `<div class="tooltip-time">🕐 ${end ? `${start} - ${end}` : start}</div>`;
        }

        if (event.data.dia_inteiro) {
          html += `<div class="tooltip-info">📅 Dia inteiro</div>`;
        }

        return html;
      } else {
        const apt = event.data;
        const title = apt.titulo || apt._service?.nome_servico || 'Agendamento';
        const clientName = apt._client?.nome || apt.nome_cliente;

        const statusMap = {
          pending: { label: 'Pendente', color: '#6B7280' },
          confirmed: { label: 'Confirmado', color: '#10B981' },
          cancelled: { label: 'Cancelado', color: '#EF4444' }
        };
        const status = statusMap[apt.status] || { label: apt.status, color: '#6B7280' };

        let html = `<div class="tooltip-title">${title}</div>`;

        if (apt.data_inicio) {
          const start = formatTime(apt.data_inicio);
          const end = apt.data_fim ? formatTime(apt.data_fim) : '';
          html += `<div class="tooltip-time">🕐 ${end ? `${start} - ${end}` : start}</div>`;
        }

        if (clientName) {
          html += `<div class="tooltip-info"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display: inline-block; vertical-align: middle; margin-right: 4px;"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>${clientName}</div>`;
        }

        if (apt.status) {
          html += `<div class="tooltip-status" style="color: ${status.color}">● ${status.label}</div>`;
        }

        if (apt.location) {
          html += `<div class="tooltip-info">📍 ${apt.location}</div>`;
        }

        return html;
      }
    };

    const getSlotEvents = (day, slot) => {
      const events = [];
      const slotStart = new Date(day.date);
      slotStart.setHours(slot.hour, slot.minute, 0, 0);
      const slotEnd = new Date(slotStart);
      slotEnd.setMinutes(slotEnd.getMinutes() + props.timeSlotMinutes);

      // Check appointments
      props.appointments.forEach(apt => {
        if (!apt?.data_inicio) return;

        const aptStart = new Date(apt.data_inicio);
        const aptEnd = apt.data_fim ? new Date(apt.data_fim) : new Date(aptStart.getTime() + 30 * 60000);

        // Check if appointment overlaps with this slot
        if (aptStart.toISOString().split('T')[0] === day.dateString) {
          if (
            (aptStart >= slotStart && aptStart < slotEnd) ||
            (aptEnd > slotStart && aptEnd <= slotEnd) ||
            (aptStart <= slotStart && aptEnd >= slotEnd)
          ) {
            events.push({
              type: 'appointment',
              id: `apt-${apt.id}`,
              data: apt,
              start: aptStart,
              end: aptEnd
            });
          }
        }
      });

      // Check blocks
      props.blocks.forEach(block => {
        if (!block?.data_inicio) return;

        const blockStart = new Date(block.data_inicio);
        const blockEnd = block.data_fim ? new Date(block.data_fim) : new Date(blockStart.getTime() + 60 * 60000);

        // Check if block overlaps with this slot
        if (blockStart.toISOString().split('T')[0] === day.dateString) {
          if (
            (blockStart >= slotStart && blockStart < slotEnd) ||
            (blockEnd > slotStart && blockEnd <= slotEnd) ||
            (blockStart <= slotStart && blockEnd >= slotEnd)
          ) {
            events.push({
              type: 'block',
              id: `block-${block.id}`,
              data: block,
              start: blockStart,
              end: blockEnd
            });
          }
        }
      });

      return events;
    };

    // Event handlers
    const handleEventClick = (event) => {
      if (event.type === 'appointment') {
        emit('appointment-click', event.data);
      }
    };

    const handleSlotClick = (day, slot) => {
      const events = getSlotEvents(day, slot);
      if (events.length === 0) {
        const slotDate = new Date(day.date);
        slotDate.setHours(slot.hour, slot.minute, 0, 0);

        emit('empty-slot-click', {
          date: day.dateString,
          time: slot.time,
          timestamp: slotDate.toISOString()
        });
      }
    };

    return {
      weekDays,
      hours,
      timeSlots,
      getDayHeaderStyle,
      dayNameStyle,
      dayDateStyle,
      timeLabelStyle,
      dayColumnStyle,
      getTimeSlotStyle,
      getEventStyle,
      getEventIndicatorStyle,
      eventTextStyle,
      formatHour,
      formatTime,
      getEventTitle,
      getEventTooltipHTML,
      getSlotEvents,
      handleEventClick,
      handleSlotClick
    };
  }
};
</script>

<style scoped lang="scss">
.week-view {
  width: 100%;
  display: flex;
  flex-direction: column;
}

.week-header {
  display: flex;
  gap: 0;
  margin-bottom: 8px;

  @media (max-width: 1024px) {
    gap: 0;
  }
}

.time-column-header {
  width: 80px;
  flex-shrink: 0;

  @media (max-width: 1024px) {
    width: 60px;
  }
}

.day-header {
  flex: 1;
  padding: 12px 8px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  margin-right: 8px;

  &:last-child {
    margin-right: 0;
  }

  @media (max-width: 768px) {
    padding: 8px 4px;
    margin-right: 4px;
  }
}

.day-name {
  text-transform: uppercase;
  font-weight: 600;
  letter-spacing: 0.5px;

  @media (max-width: 768px) {
    font-size: 11px;
  }
}

.day-date {
  @media (max-width: 768px) {
    font-size: 14px;
  }
}

.week-grid-container {
  display: flex;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  overflow: visible;
  background-color: var(--background-color);
}

.time-labels {
  width: 80px;
  flex-shrink: 0;
  border-right: 1px solid var(--border-color);
  background-color: var(--background-color);

  @media (max-width: 1024px) {
    width: 60px;
  }
}

.time-label {
  height: 60px;
  padding: 8px;
  text-align: right;
  display: flex;
  align-items: flex-start;
  justify-content: flex-end;
  font-weight: 500;
  border-bottom: 1px solid var(--border-color);

  &:last-child {
    border-bottom: none;
  }

  @media (max-width: 768px) {
    font-size: 11px;
    padding: 4px;
  }
}

.days-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  overflow: visible;
  flex: 1;
}

.day-column {
  position: relative;
  overflow: visible;

  &:last-child {
    border-right: none;
  }
}

.time-slot {
  position: relative;
  cursor: pointer;
  transition: background-color 0.2s ease;
  overflow: visible;

  &:hover {
    background-color: var(--today-highlight-color);
  }

  &:last-child {
    border-bottom: none;
  }
}

.slot-event {
  padding: 4px 6px;
  margin: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
  overflow: visible;
  display: flex;
  align-items: flex-start;
  gap: 4px;

  &:hover {
    transform: translateX(2px);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  &.cancelled {
    text-decoration: line-through;
  }

  @media (max-width: 768px) {
    padding: 3px 4px;
    margin: 2px;
  }
}

.event-indicator {
  align-self: stretch;
  margin-top: 2px;
  margin-bottom: 2px;
}

.event-content-week {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 4px;
  overflow: hidden;
  min-width: 0;
}

.event-time-range {
  font-weight: 600;
  font-size: 11px;
  white-space: nowrap;
  flex-shrink: 0;
}

.event-title {
  font-weight: 500;
  font-size: 11px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
  min-width: 0;
}

.event-status {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
}

.status-badge {
  display: flex;
  align-items: center;
  justify-content: center;

  &.pending {
    color: var(--muted-text-color);
  }

  &.confirmed {
    color: #10B981;
  }

  &.cancelled {
    color: #EF4444;
  }
}

@media (max-width: 768px) {
  .week-grid-container {
    overflow-x: auto;
  }

  .days-grid {
    min-width: 600px;
  }
}

// Custom tooltip styles
.has-tooltip {
  position: relative;

  .custom-tooltip {
    visibility: hidden;
    opacity: 0;
    position: absolute;
    bottom: calc(100% + 8px);
    left: 50%;
    transform: translateX(-50%);
    background-color: #1F2937;
    color: white;
    padding: 12px 16px;
    border-radius: 8px;
    font-size: 13px;
    line-height: 1.6;
    white-space: nowrap;
    z-index: 9999;
    pointer-events: none;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    transition: opacity 0.2s ease, transform 0.2s ease;
    min-width: 200px;

    &::after {
      content: '';
      position: absolute;
      top: 100%;
      left: 50%;
      transform: translateX(-50%);
      border: 6px solid transparent;
      border-top-color: #1F2937;
    }
  }

  &:hover .custom-tooltip {
    visibility: visible;
    opacity: 1;
    transform: translateX(-50%) translateY(-4px);
  }
}

.tooltip-title {
  font-weight: 600;
  font-size: 14px;
  margin-bottom: 6px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
  padding-bottom: 6px;
}

.tooltip-time {
  margin: 4px 0;
  font-size: 12px;
  opacity: 0.9;
}

.tooltip-info {
  margin: 4px 0;
  font-size: 12px;
  opacity: 0.9;
}

.tooltip-status {
  margin: 4px 0;
  font-size: 12px;
  font-weight: 600;
}
</style>
