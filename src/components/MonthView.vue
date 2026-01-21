<template>
  <div class="month-view">
    <!-- Weekday Headers -->
    <div class="weekday-headers">
      <div
        v-for="day in weekDays"
        :key="day"
        class="weekday-header"
        :style="weekdayHeaderStyle"
      >
        {{ day }}
      </div>
    </div>

    <!-- Calendar Grid -->
    <div class="calendar-grid">
      <div
        v-for="day in calendarDays"
        :key="day.dateString"
        class="day-cell"
        :class="{
          'other-month': !day.isCurrentMonth,
          'today': day.isToday,
          'weekend': day.isWeekend
        }"
        :style="getDayCellStyle(day)"
        @click="handleDayClick(day)"
      >
        <div class="day-number" :style="dayNumberStyle(day)">
          {{ day.date.getDate() }}
        </div>
        <div class="day-events">
          <!-- Appointments -->
          <div
            v-for="appointment in day.appointments"
            :key="appointment.id"
            class="event-item appointment"
            :class="{ cancelled: appointment.status === 'cancelled' }"
            :style="getAppointmentStyle(appointment)"
            @click.stop="handleAppointmentClick(appointment)"
          >
            <div class="event-indicator" :style="getEventIndicatorStyle(appointment)"></div>
            <div class="event-content">
              <div class="event-time">
                {{ formatTime(appointment.data_inicio) }}
              </div>
              <div class="event-title">
                {{ getAppointmentTitle(appointment) }}
              </div>
              <div v-if="appointment.status === 'pending'" class="event-badge pending">
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <circle cx="5" cy="5" r="4" stroke="currentColor" stroke-width="1.5" fill="none"/>
                </svg>
              </div>
              <div v-else-if="appointment.status === 'confirmed'" class="event-badge confirmed">
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <path d="M2 5L4 7L8 3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </div>
              <div v-else-if="appointment.status === 'cancelled'" class="event-badge cancelled">
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <path d="M2 2L8 8M8 2L2 8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                </svg>
              </div>
            </div>
          </div>

          <!-- Blocks -->
          <div
            v-for="block in day.blocks"
            :key="block.id"
            class="event-item block"
            :style="getBlockStyle()"
          >
            <div class="event-indicator block-indicator" :style="getBlockIndicatorStyle()"></div>
            <div class="event-content">
              <div class="event-time">
                {{ formatTime(block.data_inicio) }}
              </div>
              <div class="event-title">
                {{ block.motivo || 'Bloqueado' }}
              </div>
            </div>
          </div>

          <!-- More indicator -->
          <div
            v-if="day.totalEvents > 3"
            class="more-events"
            :style="moreEventsStyle"
          >
            +{{ day.totalEvents - 3 }} mais
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { computed } from 'vue';

export default {
  name: 'MonthView',
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
    styles: {
      type: Object,
      required: true
    }
  },
  emits: ['appointment-click', 'empty-slot-click'],
  setup(props, { emit }) {
    const weekDays = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

    const calendarDays = computed(() => {
      const year = props.currentDate.getFullYear();
      const month = props.currentDate.getMonth();

      // First day of the month
      const firstDay = new Date(year, month, 1);
      // Last day of the month
      const lastDay = new Date(year, month + 1, 0);

      // Start from Monday of the week containing the 1st
      const startDate = new Date(firstDay);
      const dayOfWeek = firstDay.getDay();
      const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Monday as first day
      startDate.setDate(firstDay.getDate() + diff);

      // End on Sunday of the week containing the last day
      const endDate = new Date(lastDay);
      const lastDayOfWeek = lastDay.getDay();
      const endDiff = lastDayOfWeek === 0 ? 0 : 7 - lastDayOfWeek;
      endDate.setDate(lastDay.getDate() + endDiff);

      const days = [];
      const current = new Date(startDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      while (current <= endDate) {
        const date = new Date(current);
        const dateString = date.toISOString().split('T')[0];
        const isCurrentMonth = date.getMonth() === month;
        const isToday = date.getTime() === today.getTime();
        const isWeekend = date.getDay() === 0 || date.getDay() === 6;

        // Get appointments for this day
        const dayAppointments = props.appointments.filter(apt => {
          if (!apt?.data_inicio) return false;
          const aptDate = new Date(apt.data_inicio);
          return aptDate.toISOString().split('T')[0] === dateString;
        }).slice(0, 3); // Limit to 3 visible

        // Get blocks for this day
        const dayBlocks = props.blocks.filter(block => {
          if (!block?.data_inicio) return false;
          const blockDate = new Date(block.data_inicio);
          return blockDate.toISOString().split('T')[0] === dateString;
        }).slice(0, 3 - dayAppointments.length); // Fill remaining space

        const totalEvents = props.appointments.filter(apt => {
          if (!apt?.data_inicio) return false;
          const aptDate = new Date(apt.data_inicio);
          return aptDate.toISOString().split('T')[0] === dateString;
        }).length + props.blocks.filter(block => {
          if (!block?.data_inicio) return false;
          const blockDate = new Date(block.data_inicio);
          return blockDate.toISOString().split('T')[0] === dateString;
        }).length;

        days.push({
          date,
          dateString,
          isCurrentMonth,
          isToday,
          isWeekend,
          appointments: dayAppointments,
          blocks: dayBlocks,
          totalEvents
        });

        current.setDate(current.getDate() + 1);
      }

      return days;
    });

    // Styles
    const weekdayHeaderStyle = computed(() => ({
      fontSize: props.styles.bodyFontSize,
      color: props.styles.mutedTextColor,
      fontWeight: '600'
    }));

    const getDayCellStyle = (day) => {
      const baseStyle = {
        backgroundColor: day.isToday ? props.styles.todayHighlightColor : props.styles.backgroundColor,
        border: `1px solid ${props.styles.borderColor}`,
        cursor: 'pointer'
      };

      if (!day.isCurrentMonth) {
        baseStyle.opacity = '0.5';
      }

      return baseStyle;
    };

    const dayNumberStyle = (day) => ({
      fontSize: props.styles.bodyFontSize,
      color: day.isToday ? props.styles.primaryColor : props.styles.textColor,
      fontWeight: day.isToday ? '700' : '500'
    });

    const getAppointmentStyle = (appointment) => {
      const style = {
        backgroundColor: props.styles.appointmentBg,
        color: props.styles.appointmentText,
        border: `1px solid ${props.styles.appointmentText}20`,
        borderRadius: '8px'
      };

      if (appointment.status === 'cancelled') {
        style.opacity = props.styles.cancelledOpacity;
      }

      return style;
    };

    const getBlockStyle = () => ({
      backgroundColor: props.styles.blockBg,
      color: props.styles.blockText,
      border: `1px solid ${props.styles.blockText}20`,
      borderRadius: '8px'
    });

    const getEventIndicatorStyle = (appointment) => ({
      backgroundColor: props.styles.appointmentText
    });

    const getBlockIndicatorStyle = () => ({
      backgroundColor: props.styles.blockText
    });

    const moreEventsStyle = computed(() => ({
      fontSize: props.styles.bodyFontSize,
      color: props.styles.mutedTextColor
    }));

    // Utility functions
    const formatTime = (dateString) => {
      if (!dateString) return '';
      const date = new Date(dateString);
      return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    };

    const getAppointmentTitle = (appointment) => {
      if (appointment.titulo) return appointment.titulo;
      if (appointment._service?.nome_servico) return appointment._service.nome_servico;
      if (appointment.nome_cliente) return appointment.nome_cliente;
      if (appointment._client?.nome) return appointment._client.nome;
      return 'Agendamento';
    };

    // Event handlers
    const handleAppointmentClick = (appointment) => {
      emit('appointment-click', appointment);
    };

    const handleDayClick = (day) => {
      if (day.appointments.length === 0 && day.blocks.length === 0) {
        emit('empty-slot-click', {
          date: day.dateString,
          time: null,
          timestamp: day.date.toISOString()
        });
      }
    };

    return {
      weekDays,
      calendarDays,
      weekdayHeaderStyle,
      getDayCellStyle,
      dayNumberStyle,
      getAppointmentStyle,
      getBlockStyle,
      getEventIndicatorStyle,
      getBlockIndicatorStyle,
      moreEventsStyle,
      formatTime,
      getAppointmentTitle,
      handleAppointmentClick,
      handleDayClick
    };
  }
};
</script>

<style scoped lang="scss">
.month-view {
  width: 100%;
}

.weekday-headers {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 0;
  margin-bottom: 8px;
}

.weekday-header {
  padding: 8px;
  text-align: center;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 0;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  overflow: hidden;

  @media (max-width: 768px) {
    gap: 0;
  }
}

.day-cell {
  min-height: 120px;
  padding: 8px;
  display: flex;
  flex-direction: column;
  transition: background-color 0.2s ease;

  &:hover:not(.other-month) {
    background-color: var(--today-highlight-color) !important;
  }

  @media (max-width: 768px) {
    min-height: 80px;
    padding: 4px;
  }
}

.day-number {
  margin-bottom: 4px;
  text-align: right;
  line-height: 1.5;

  @media (max-width: 768px) {
    font-size: 12px;
  }
}

.day-events {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
  overflow: hidden;
}

.event-item {
  padding: 4px 6px;
  display: flex;
  align-items: flex-start;
  gap: 6px;
  font-size: 12px;
  transition: all 0.2s ease;
  cursor: pointer;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  &.cancelled {
    text-decoration: line-through;
  }

  @media (max-width: 768px) {
    padding: 3px 4px;
    font-size: 11px;
    gap: 4px;
  }
}

.event-indicator {
  width: 3px;
  min-width: 3px;
  height: 100%;
  border-radius: 2px;
  margin-top: 2px;
}

.event-content {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 4px;
  overflow: hidden;
}

.event-time {
  font-weight: 600;
  white-space: nowrap;
  flex-shrink: 0;
}

.event-title {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.event-badge {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

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

.more-events {
  padding: 4px 6px;
  text-align: center;
  font-weight: 500;
  cursor: pointer;
  border-radius: 4px;

  &:hover {
    background-color: var(--border-color);
  }
}
</style>
