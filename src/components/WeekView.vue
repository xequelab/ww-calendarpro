<template>
  <div class="week-view">
    <!-- Time Column + Day Columns Header -->
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

    <!-- Time Grid -->
    <div class="week-grid-container">
      <!-- Time labels column -->
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

      <!-- Days grid -->
      <div class="days-grid">
        <div
          v-for="day in weekDays"
          :key="day.dateString"
          class="day-column"
          :style="dayColumnStyle"
        >
          <!-- Time slots -->
          <div
            v-for="slot in timeSlots"
            :key="slot.time"
            class="time-slot"
            :style="getTimeSlotStyle(slot)"
            @click="handleSlotClick(day, slot)"
          >
            <!-- Slot events -->
            <div
              v-for="event in getSlotEvents(day, slot)"
              :key="event.id"
              class="slot-event"
              :class="{
                'appointment': event.type === 'appointment',
                'block': event.type === 'block',
                'cancelled': event.type === 'appointment' && event.data.status === 'cancelled'
              }"
              :style="getEventStyle(event)"
              @click.stop="handleEventClick(event)"
            >
              <div class="event-time-range" :style="eventTextStyle(event)">
                {{ formatTime(event.data.data_inicio) }}
                <span v-if="event.data.data_fim"> - {{ formatTime(event.data.data_fim) }}</span>
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
          border: `1px solid ${props.styles.blockText}40`,
          borderLeft: `3px solid ${props.styles.blockText}`,
          borderRadius: '8px',
          opacity: 1
        };
      }

      const style = {
        backgroundColor: props.styles.appointmentBg,
        color: props.styles.appointmentText,
        border: `1px solid ${props.styles.appointmentText}40`,
        borderLeft: `3px solid ${props.styles.appointmentText}`,
        borderRadius: '8px'
      };

      if (event.data.status === 'cancelled') {
        style.opacity = props.styles.cancelledOpacity;
      }

      return style;
    };

    const eventTextStyle = (event) => ({
      fontSize: props.styles.bodyFontSize
    });

    // Utility functions
    const formatHour = (hour) => {
      const period = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
      return `${displayHour} ${period}`;
    };

    const formatTime = (dateString) => {
      if (!dateString) return '';
      const date = new Date(dateString);
      return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
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
      eventTextStyle,
      formatHour,
      formatTime,
      getEventTitle,
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
  display: grid;
  grid-template-columns: 80px repeat(7, 1fr);
  gap: 8px;
  margin-bottom: 8px;

  @media (max-width: 1024px) {
    grid-template-columns: 60px repeat(7, 1fr);
    gap: 4px;
  }
}

.time-column-header {
  // Empty space for time column
}

.day-header {
  padding: 12px 8px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;

  @media (max-width: 768px) {
    padding: 8px 4px;
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
  display: grid;
  grid-template-columns: 80px 1fr;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  overflow: hidden;
  background-color: var(--background-color);

  @media (max-width: 1024px) {
    grid-template-columns: 60px 1fr;
  }
}

.time-labels {
  border-right: 1px solid var(--border-color);
  background-color: var(--background-color);
}

.time-label {
  height: 60px;
  padding: 8px;
  text-align: right;
  display: flex;
  align-items: flex-start;
  justify-content: flex-end;
  font-weight: 500;

  @media (max-width: 768px) {
    font-size: 11px;
    padding: 4px;
  }
}

.days-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  overflow-x: auto;
}

.day-column {
  position: relative;

  &:last-child {
    border-right: none;
  }
}

.time-slot {
  position: relative;
  cursor: pointer;
  transition: background-color 0.2s ease;

  &:hover {
    background-color: var(--today-highlight-color);
  }

  &:last-child {
    border-bottom: none;
  }
}

.slot-event {
  padding: 6px 8px;
  margin: 2px 4px;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
  overflow: hidden;

  &:hover {
    transform: translateX(2px);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  &.cancelled {
    text-decoration: line-through;
  }

  @media (max-width: 768px) {
    padding: 4px 6px;
    margin: 1px 2px;
  }
}

.event-time-range {
  font-weight: 600;
  font-size: 11px;
  margin-bottom: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.event-title {
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: 2px;
}

.event-status {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 4px;
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
</style>
