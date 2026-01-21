<template>
  <div class="day-view">
    <!-- Day Header -->
    <div class="day-header" :style="dayHeaderStyle">
      <div class="day-name" :style="dayNameStyle">{{ dayName }}</div>
      <div class="day-date" :style="dayDateStyle">{{ formattedDate }}</div>
    </div>

    <!-- Time Grid -->
    <div class="day-grid-container">
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

      <!-- Day column -->
      <div class="day-column" :style="dayColumnStyle">
        <!-- Time slots -->
        <div
          v-for="slot in timeSlots"
          :key="slot.time"
          class="time-slot"
          :style="getTimeSlotStyle(slot)"
          @click="handleSlotClick(slot)"
        >
          <!-- Current time indicator -->
          <div
            v-if="isCurrentTimeSlot(slot)"
            class="current-time-indicator"
            :style="currentTimeIndicatorStyle"
          ></div>

          <!-- Slot events -->
          <div
            v-for="event in getSlotEvents(slot)"
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
    styles: {
      type: Object,
      required: true
    }
  },
  emits: ['appointment-click', 'empty-slot-click'],
  setup(props, { emit }) {
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const dayName = computed(() => dayNames[props.currentDate.getDay()]);
    const formattedDate = computed(() => {
      const month = monthNames[props.currentDate.getMonth()];
      const date = props.currentDate.getDate();
      const year = props.currentDate.getFullYear();
      return `${month} ${date}, ${year}`;
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
      const today = new Date();
      return dateString.value === today.toISOString().split('T')[0];
    });

    const isCurrentTimeSlot = (slot) => {
      if (!isToday.value) return false;

      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();

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
        return event.data.motivo || 'Blocked';
      }

      const apt = event.data;
      if (apt.titulo) return apt.titulo;
      if (apt._service?.nome_servico) return apt._service.nome_servico;
      if (apt.nome_cliente) return apt.nome_cliente;
      if (apt._client?.nome) return apt._client.nome;
      return 'Appointment';
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

    const getSlotEvents = (slot) => {
      const events = [];
      const slotStart = new Date(props.currentDate);
      slotStart.setHours(slot.hour, slot.minute, 0, 0);
      const slotEnd = new Date(slotStart);
      slotEnd.setMinutes(slotEnd.getMinutes() + props.timeSlotMinutes);

      // Check appointments
      props.appointments.forEach(apt => {
        if (!apt?.data_inicio) return;

        const aptStart = new Date(apt.data_inicio);
        const aptEnd = apt.data_fim ? new Date(apt.data_fim) : new Date(aptStart.getTime() + 30 * 60000);

        // Check if appointment overlaps with this slot
        if (aptStart.toISOString().split('T')[0] === dateString.value) {
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
        if (blockStart.toISOString().split('T')[0] === dateString.value) {
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

    const handleSlotClick = (slot) => {
      const events = getSlotEvents(slot);
      if (events.length === 0) {
        const slotDate = new Date(props.currentDate);
        slotDate.setHours(slot.hour, slot.minute, 0, 0);

        emit('empty-slot-click', {
          date: dateString.value,
          time: slot.time,
          timestamp: slotDate.toISOString()
        });
      }
    };

    return {
      dayName,
      formattedDate,
      hours,
      timeSlots,
      isCurrentTimeSlot,
      dayHeaderStyle,
      dayNameStyle,
      dayDateStyle,
      timeLabelStyle,
      dayColumnStyle,
      getTimeSlotStyle,
      currentTimeIndicatorStyle,
      getEventStyle,
      eventTextStyle,
      eventTitleStyle,
      eventDetailsStyle,
      formatHour,
      formatTime,
      getEventTitle,
      getEventDetails,
      getSlotEvents,
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
  position: relative;
  cursor: pointer;
  transition: background-color 0.2s ease;
  padding: 4px;

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
  z-index: 10;
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

.slot-event {
  padding: 12px;
  margin: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
  overflow: hidden;

  &:hover {
    transform: translateX(4px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  }

  &.cancelled {
    text-decoration: line-through;
  }

  @media (max-width: 768px) {
    padding: 8px;
    margin: 2px;
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
</style>
