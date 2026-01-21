<template>
  <div class="day-view">
    <!-- Cabeçalho do dia -->
    <div class="day-header" :style="dayHeaderStyle">
      <div class="day-name" :style="dayNameStyle">{{ dayName }}</div>
      <div class="day-date" :style="dayDateStyle">{{ formattedDate }}</div>
    </div>

    <!-- Grade de horários -->
    <div class="day-grid-container">
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

      <!-- Coluna do dia -->
      <div class="day-column" :style="dayColumnStyle">
        <!-- Slots de horário (fundo) -->
        <div
          v-for="slot in timeSlots"
          :key="slot.time"
          class="time-slot"
          :style="getTimeSlotStyle(slot)"
          @click="handleSlotClick(slot)"
        >
          <!-- Indicador de horário atual -->
          <div
            v-if="isCurrentTimeSlot(slot)"
            class="current-time-indicator"
            :style="currentTimeIndicatorStyle"
          ></div>
        </div>

        <!-- Eventos posicionados absolutamente -->
        <div class="events-container">
          <div
            v-for="event in dayEvents"
            :key="event.id"
            class="day-event has-tooltip"
            :class="{
              'appointment': event.type === 'appointment',
              'block': event.type === 'block',
              'cancelled': event.type === 'appointment' && event.data.status === 'cancelled'
            }"
            :style="getAbsoluteEventStyle(event)"
            @click.stop="handleEventClick(event)"
          >
            <div class="custom-tooltip" v-html="getEventTooltipHTML(event)"></div>
            <div class="event-header">
              <div class="event-time-range" :style="eventTextStyle(event)">
                {{ formatTime(event.data.data_inicio) }}
                <span v-if="event.data.data_fim"> - {{ formatTime(event.data.data_fim) }}</span>
              </div>
              <div v-if="event.type === 'appointment'" class="event-status">
                <div v-if="event.data.status === 'pending'" class="status-badge pending">
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <circle cx="6" cy="6" r="5" stroke="currentColor" stroke-width="1.5" fill="none"/>
                  </svg>
                </div>
                <div v-else-if="event.data.status === 'confirmed'" class="status-badge confirmed">
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M2.5 6L5 8.5L9.5 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </div>
                <div v-else-if="event.data.status === 'cancelled'" class="status-badge cancelled">
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M3 3L9 9M9 3L3 9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                  </svg>
                </div>
              </div>
            </div>
            <div class="event-title" :style="eventTitleStyle(event)">
              {{ getEventTitle(event) }}
            </div>
            <div
              v-if="event.type === 'appointment' && getEventDetails(event)"
              class="event-details"
              :style="eventDetailsStyle(event)"
            >
              {{ getEventDetails(event) }}
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
  name: 'DayView',
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
    timezone: {
      type: String,
      default: 'America/Sao_Paulo'
    },
    styles: {
      type: Object,
      required: true
    }
  },
  emits: ['appointment-click', 'empty-slot-click'],
  setup(props, { emit }) {
    const dayNames = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
    const monthNames = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];

    const dayName = computed(() => dayNames[props.currentDate.getDay()]);
    const formattedDate = computed(() => {
      const month = monthNames[props.currentDate.getMonth()];
      const date = props.currentDate.getDate();
      const year = props.currentDate.getFullYear();
      return `${date} de ${month} de ${year}`;
    });

    const dateString = computed(() => props.currentDate.toISOString().split('T')[0]);

    const hours = computed(() => {
      const hrs = [];
      for (let h = props.workingHoursStart; h <= props.workingHoursEnd; h++) {
        hrs.push(h);
      }
      return hrs;
    });

    const timeSlots = computed(() => {
      const slots = [];

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

    // Check if this is today and if slot is current time
    const isToday = computed(() => {
      const now = new Date();
      const tzDate = new Date(now.toLocaleString('en-US', { timeZone: props.timezone || 'America/Sao_Paulo' }));
      return dateString.value === tzDate.toISOString().split('T')[0];
    });

    const isCurrentTimeSlot = (slot) => {
      if (!isToday.value) return false;

      // Get current time in the user's timezone
      const now = new Date();
      const tzDate = new Date(now.toLocaleString('en-US', { timeZone: props.timezone || 'America/Sao_Paulo' }));
      const currentHour = tzDate.getHours();
      const currentMinute = tzDate.getMinutes();

      const slotStart = slot.hour * 60 + slot.minute;
      const slotEnd = slotStart + props.timeSlotMinutes;
      const currentTime = currentHour * 60 + currentMinute;

      return currentTime >= slotStart && currentTime < slotEnd;
    };

    // Styles
    const dayHeaderStyle = computed(() => ({
      backgroundColor: isToday.value ? props.styles.todayHighlightColor : props.styles.backgroundColor,
      border: `1px solid ${props.styles.borderColor}`,
      borderRadius: '8px'
    }));

    const dayNameStyle = computed(() => ({
      fontSize: props.styles.bodyFontSize,
      color: props.styles.mutedTextColor
    }));

    const dayDateStyle = computed(() => ({
      fontSize: props.styles.headerFontSize,
      color: isToday.value ? props.styles.primaryColor : props.styles.textColor,
      fontWeight: isToday.value ? '700' : '600'
    }));

    const timeLabelStyle = computed(() => ({
      fontSize: props.styles.bodyFontSize,
      color: props.styles.mutedTextColor
    }));

    const dayColumnStyle = computed(() => ({
      borderLeft: `1px solid ${props.styles.borderColor}`
    }));

    const getTimeSlotStyle = (slot) => ({
      borderBottom: `1px solid ${props.styles.borderColor}`,
      minHeight: '80px',
      backgroundColor: isCurrentTimeSlot(slot) ? props.styles.todayHighlightColor : 'transparent'
    });

    const currentTimeIndicatorStyle = computed(() => ({
      backgroundColor: props.styles.primaryColor
    }));

    const getEventStyle = (event) => {
      if (event.type === 'block') {
        return {
          backgroundColor: props.styles.blockBg,
          color: props.styles.blockText,
          border: `1px solid ${props.styles.blockText}40`,
          borderLeft: `4px solid ${props.styles.blockText}`,
          borderRadius: '8px',
          opacity: 1
        };
      }

      const style = {
        backgroundColor: props.styles.appointmentBg,
        color: props.styles.appointmentText,
        border: `1px solid ${props.styles.appointmentText}40`,
        borderLeft: `4px solid ${props.styles.appointmentText}`,
        borderRadius: '8px'
      };

      if (event.data.status === 'cancelled') {
        style.opacity = props.styles.cancelledOpacity;
      }

      return style;
    };

    const eventTextStyle = (event) => ({
      fontSize: props.styles.bodyFontSize,
      fontWeight: '600'
    });

    const eventTitleStyle = (event) => ({
      fontSize: props.styles.headerFontSize,
      fontWeight: '600'
    });

    const eventDetailsStyle = (event) => ({
      fontSize: props.styles.bodyFontSize,
      opacity: '0.8'
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

    const getEventDetails = (event) => {
      if (event.type !== 'appointment') return '';

      const apt = event.data;
      const details = [];

      // Client info
      if (apt._client?.nome) {
        details.push(apt._client.nome);
      } else if (apt.nome_cliente) {
        details.push(apt.nome_cliente);
      }

      // Service info
      if (apt._service?.nome_servico && !apt.titulo) {
        details.push(apt._service.nome_servico);
      }

      // Location
      if (apt.location) {
        details.push(apt.location);
      }

      return details.join(' • ');
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
          html += `<div class="tooltip-info">👤 ${clientName}</div>`;
        }

        if (apt._service?.nome_servico && apt.titulo) {
          html += `<div class="tooltip-info">💼 ${apt._service.nome_servico}</div>`;
        }

        if (apt.status) {
          html += `<div class="tooltip-status" style="color: ${status.color}">● ${status.label}</div>`;
        }

        if (apt.location) {
          html += `<div class="tooltip-info">📍 ${apt.location}</div>`;
        }

        if (apt.descricao) {
          html += `<div class="tooltip-description">${apt.descricao}</div>`;
        }

        return html;
      }
    };

    // Get all events for the day
    const dayEvents = computed(() => {
      const events = [];

      // Check appointments
      props.appointments.forEach(apt => {
        if (!apt?.data_inicio) return;

        const aptStart = new Date(apt.data_inicio);
        const aptEnd = apt.data_fim ? new Date(apt.data_fim) : new Date(aptStart.getTime() + 30 * 60000);

        // Check if appointment is on this day
        if (aptStart.toISOString().split('T')[0] === dateString.value) {
          events.push({
            type: 'appointment',
            id: `apt-${apt.id}`,
            data: apt,
            start: aptStart,
            end: aptEnd
          });
        }
      });

      // Check blocks
      props.blocks.forEach(block => {
        if (!block?.data_inicio) return;

        const blockStart = new Date(block.data_inicio);
        const blockEnd = block.data_fim ? new Date(block.data_fim) : new Date(blockStart.getTime() + 60 * 60000);

        // Check if block is on this day
        if (blockStart.toISOString().split('T')[0] === dateString.value) {
          events.push({
            type: 'block',
            id: `block-${block.id}`,
            data: block,
            start: blockStart,
            end: blockEnd
          });
        }
      });

      return events;
    });

    // Calculate absolute position for event
    const getAbsoluteEventStyle = (event) => {
      const startHour = event.start.getHours();
      const startMinute = event.start.getMinutes();
      const endHour = event.end.getHours();
      const endMinute = event.end.getMinutes();

      // Calculate position in minutes from start of working hours
      const startMinutes = (startHour - props.workingHoursStart) * 60 + startMinute;
      const endMinutes = (endHour - props.workingHoursStart) * 60 + endMinute;
      const durationMinutes = endMinutes - startMinutes;

      // Each hour slot is 80px
      const pixelsPerMinute = 80 / 60;
      const top = startMinutes * pixelsPerMinute;
      const height = Math.max(durationMinutes * pixelsPerMinute, 40); // Minimum 40px height

      const baseStyle = {
        position: 'absolute',
        top: `${top}px`,
        left: '4px',
        right: '4px',
        height: `${height}px`,
        zIndex: 10
      };

      if (event.type === 'block') {
        return {
          ...baseStyle,
          backgroundColor: props.styles.blockBg,
          color: props.styles.blockText,
          border: `1px solid ${props.styles.blockText}40`,
          borderLeft: `4px solid ${props.styles.blockText}`,
          borderRadius: '8px',
          opacity: 1
        };
      }

      const style = {
        ...baseStyle,
        backgroundColor: props.styles.appointmentBg,
        color: props.styles.appointmentText,
        border: `1px solid ${props.styles.appointmentText}40`,
        borderLeft: `4px solid ${props.styles.appointmentText}`,
        borderRadius: '8px'
      };

      if (event.data.status === 'cancelled') {
        style.opacity = props.styles.cancelledOpacity;
      }

      return style;
    };

    // Event handlers
    const handleEventClick = (event) => {
      if (event.type === 'appointment') {
        emit('appointment-click', event.data);
      }
    };

    const handleSlotClick = (slot) => {
      const slotDate = new Date(props.currentDate);
      slotDate.setHours(slot.hour, slot.minute, 0, 0);

      emit('empty-slot-click', {
        date: dateString.value,
        time: slot.time,
        timestamp: slotDate.toISOString()
      });
    };

    return {
      dayName,
      formattedDate,
      hours,
      timeSlots,
      dayEvents,
      isCurrentTimeSlot,
      dayHeaderStyle,
      dayNameStyle,
      dayDateStyle,
      timeLabelStyle,
      dayColumnStyle,
      getTimeSlotStyle,
      currentTimeIndicatorStyle,
      getAbsoluteEventStyle,
      eventTextStyle,
      eventTitleStyle,
      eventDetailsStyle,
      formatHour,
      formatTime,
      getEventTitle,
      getEventDetails,
      getEventTooltipHTML,
      handleEventClick,
      handleSlotClick
    };
  }
};
</script>

<style scoped lang="scss">
.day-view {
  width: 100%;
  display: flex;
  flex-direction: column;
}

.day-header {
  padding: 16px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  margin-bottom: 16px;
}

.day-name {
  text-transform: uppercase;
  font-weight: 600;
  letter-spacing: 1px;
}

.day-date {
  font-size: 20px;
}

.day-grid-container {
  display: grid;
  grid-template-columns: 100px 1fr;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  overflow: hidden;
  background-color: var(--background-color);

  @media (max-width: 768px) {
    grid-template-columns: 70px 1fr;
  }
}

.time-labels {
  border-right: 1px solid var(--border-color);
  background-color: var(--background-color);
}

.time-label {
  height: 80px;
  padding: 8px;
  text-align: right;
  display: flex;
  align-items: flex-start;
  justify-content: flex-end;
  font-weight: 500;

  @media (max-width: 768px) {
    font-size: 11px;
    padding: 6px;
  }
}

.day-column {
  position: relative;
}

.time-slot {
  height: 80px;
  cursor: pointer;
  transition: background-color 0.2s ease;
  border-bottom: 1px solid var(--border-color);

  &:hover {
    background-color: var(--today-highlight-color);
  }

  &:last-child {
    border-bottom: none;
  }
}

.current-time-indicator {
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  height: 2px;
  z-index: 15;
  pointer-events: none;

  &::before {
    content: '';
    position: absolute;
    left: -6px;
    top: -4px;
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background-color: inherit;
  }
}

.events-container {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
}

.day-event {
  padding: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  overflow: hidden;
  pointer-events: auto;

  &:hover {
    transform: translateX(4px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  }

  &.cancelled {
    text-decoration: line-through;
  }

  @media (max-width: 768px) {
    padding: 8px;
  }
}

.event-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.event-time-range {
  white-space: nowrap;
}

.event-status {
  display: flex;
  align-items: center;
  gap: 4px;
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

.event-title {
  margin-bottom: 4px;
  line-height: 1.4;
}

.event-details {
  line-height: 1.4;
  margin-top: 4px;
}

// Custom tooltip styles
.has-tooltip {
  position: relative;

  .custom-tooltip {
    visibility: hidden;
    opacity: 0;
    position: absolute;
    bottom: 100%;
    left: 50%;
    transform: translateX(-50%) translateY(-8px);
    background-color: #1F2937;
    color: white;
    padding: 12px 16px;
    border-radius: 8px;
    font-size: 13px;
    line-height: 1.6;
    white-space: nowrap;
    z-index: 1000;
    pointer-events: none;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    transition: opacity 0.2s ease, transform 0.2s ease;
    max-width: 300px;

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

.tooltip-description {
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid rgba(255, 255, 255, 0.2);
  font-size: 12px;
  opacity: 0.85;
  white-space: normal;
  max-width: 250px;
}
</style>
