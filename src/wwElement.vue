<template>
  <div class="calendar-pro" :style="containerStyle">
    <!-- Navegação do cabeçalho -->
    <div class="calendar-header">
      <div class="header-left">
        <button
          class="btn-today"
          :style="buttonStyle"
          @click="handleGoToToday"
        >
          {{ todayButtonText }}
        </button>
        <div class="nav-buttons">
          <button
            class="btn-nav"
            :style="buttonStyle"
            @click="handlePreviousPeriod"
            aria-label="Previous"
          >
            ‹
          </button>
          <button
            class="btn-nav"
            :style="buttonStyle"
            @click="handleNextPeriod"
            aria-label="Next"
          >
            ›
          </button>
        </div>
        <h2 class="current-period" :style="headerTextStyle">
          {{ currentPeriodLabel }}
        </h2>
      </div>
      <div class="header-right">
        <div class="view-switcher">
          <button
            v-for="view in views"
            :key="view.value"
            class="btn-view"
            :class="{ active: currentView === view.value }"
            :style="getViewButtonStyle(view.value)"
            @click="handleChangeView(view.value)"
          >
            {{ view.label }}
          </button>
        </div>
      </div>
    </div>

    <!-- Visualizações do calendário -->
    <div class="calendar-body">
      <MonthView
        v-if="currentView === 'month'"
        :current-date="currentDate"
        :appointments="processedAppointments"
        :blocks="processedBlocks"
        :styles="viewStyles"
        @appointment-click="handleAppointmentClick"
        @empty-slot-click="handleEmptySlotClick"
      />
      <WeekView
        v-else-if="currentView === 'week'"
        :current-date="currentDate"
        :appointments="processedAppointments"
        :blocks="processedBlocks"
        :working-hours-start="workingHoursStart"
        :working-hours-end="workingHoursEnd"
        :time-slot-minutes="timeSlotMinutes"
        :styles="viewStyles"
        @appointment-click="handleAppointmentClick"
        @empty-slot-click="handleEmptySlotClick"
      />
      <DayView
        v-else-if="currentView === 'day'"
        :current-date="currentDate"
        :appointments="processedAppointments"
        :blocks="processedBlocks"
        :working-hours-start="workingHoursStart"
        :working-hours-end="workingHoursEnd"
        :time-slot-minutes="timeSlotMinutes"
        :timezone="content.timezone"
        :styles="viewStyles"
        @appointment-click="handleAppointmentClick"
        @empty-slot-click="handleEmptySlotClick"
      />
    </div>
  </div>
</template>

<script>
import { ref, computed, watch } from 'vue';
import MonthView from './components/MonthView.vue';
import WeekView from './components/WeekView.vue';
import DayView from './components/DayView.vue';

export default {
  name: 'CalendarPro',
  components: {
    MonthView,
    WeekView,
    DayView
  },
  props: {
    content: {
      type: Object,
      required: true
    },
    uid: {
      type: String,
      required: true
    },
    /* wwEditor:start */
    wwEditorState: {
      type: Object,
      required: true
    }
    /* wwEditor:end */
  },
  emits: ['trigger-event'],
  setup(props, { emit }) {
    // Editor detection
    const isEditing = computed(() => {
      /* wwEditor:start */
      return props.wwEditorState.isEditing;
      /* wwEditor:end */
      return false;
    });

    // State
    const currentDate = ref(new Date());
    const currentView = ref(props.content.defaultView || 'month');

    // Component variables
    const { value: startDate, setValue: setStartDate } = wwLib.wwVariable.useComponentVariable({
      uid: props.uid,
      name: 'startDate',
      type: 'string',
      defaultValue: null
    });

    const { value: endDate, setValue: setEndDate } = wwLib.wwVariable.useComponentVariable({
      uid: props.uid,
      name: 'endDate',
      type: 'string',
      defaultValue: null
    });

    const { value: selectedAppointment, setValue: setSelectedAppointment } = wwLib.wwVariable.useComponentVariable({
      uid: props.uid,
      name: 'selectedAppointment',
      type: 'object',
      defaultValue: null
    });

    const { value: currentViewVar, setValue: setCurrentViewVar } = wwLib.wwVariable.useComponentVariable({
      uid: props.uid,
      name: 'currentView',
      type: 'string',
      defaultValue: props.content.defaultView || 'month'
    });

    const { value: currentDateVar, setValue: setCurrentDateVar } = wwLib.wwVariable.useComponentVariable({
      uid: props.uid,
      name: 'currentDate',
      type: 'string',
      defaultValue: new Date().toISOString()
    });

    // Computed properties
    const workingHoursStart = computed(() => props.content.workingHoursStart ?? 6);
    const workingHoursEnd = computed(() => props.content.workingHoursEnd ?? 22);
    const timeSlotMinutes = computed(() => props.content.timeSlotMinutes ?? 30);

    const todayButtonText = computed(() => {
      return wwLib.wwLang.getText(props.content.todayLabel);
    });

    const views = computed(() => [
      { value: 'month', label: wwLib.wwLang.getText(props.content.monthLabel) },
      { value: 'week', label: wwLib.wwLang.getText(props.content.weekLabel) },
      { value: 'day', label: wwLib.wwLang.getText(props.content.dayLabel) }
    ]);

    const currentPeriodLabel = computed(() => {
      const date = currentDate.value;
      const monthNames = [
        'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
      ];

      if (currentView.value === 'month') {
        return `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
      } else if (currentView.value === 'week') {
        const startOfWeek = getStartOfWeek(date);
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(endOfWeek.getDate() + 6);

        return `${startOfWeek.getDate()} de ${monthNames[startOfWeek.getMonth()]} - ${
          startOfWeek.getMonth() !== endOfWeek.getMonth() ? endOfWeek.getDate() + ' de ' + monthNames[endOfWeek.getMonth()] : endOfWeek.getDate()
        }, ${endOfWeek.getFullYear()}`;
      } else {
        return `${date.getDate()} de ${monthNames[date.getMonth()]} de ${date.getFullYear()}`;
      }
    });

    // Process collections
    const processedAppointments = computed(() => {
      const appointments = props.content.agendamentos || [];
      const services = props.content.servicos || [];
      const professionals = props.content.profissionais || [];
      const clients = props.content.clientes || [];

      if (!Array.isArray(appointments)) return [];

      return appointments.map(apt => {
        if (!apt) return null;

        const service = services.find(s => s?.id === apt.servico_id);
        const professional = professionals.find(p => p?.id === apt.profissional_id);
        const client = clients.find(c => c?.id === apt.cliente_id);

        return {
          ...apt,
          _service: service,
          _professional: professional,
          _client: client
        };
      }).filter(apt => apt != null);
    });

    const processedBlocks = computed(() => {
      const blocks = props.content.bloqueios || [];
      if (!Array.isArray(blocks)) return [];
      return blocks.filter(block => block != null);
    });

    // Styles
    const containerStyle = computed(() => ({
      '--primary-color': props.content.primaryColor || '#081B4E',
      '--background-color': props.content.backgroundColor || '#FFFFFF',
      '--border-color': props.content.borderColor || '#E5E7EB',
      '--text-color': props.content.textColor || '#1F2937',
      '--muted-text-color': props.content.mutedTextColor || '#6B7280',
      '--today-highlight-color': props.content.todayHighlightColor || '#EFF6FF',
      '--appointment-bg': props.content.appointmentBackgroundColor || '#DBEAFE',
      '--appointment-text': props.content.appointmentTextColor || '#1E40AF',
      '--block-bg': props.content.blockBackgroundColor || '#FEE2E2',
      '--block-text': props.content.blockTextColor || '#991B1B',
      '--cancelled-opacity': props.content.cancelledOpacity ?? 0.5,
      '--header-font-size': props.content.headerFontSize || '16px',
      '--body-font-size': props.content.bodyFontSize || '14px'
    }));

    const buttonStyle = computed(() => ({
      backgroundColor: 'transparent',
      border: `1px solid ${props.content.borderColor || '#E5E7EB'}`,
      borderRadius: '8px',
      padding: '6px 12px',
      fontSize: props.content.bodyFontSize || '14px',
      color: props.content.textColor || '#1F2937',
      cursor: 'pointer'
    }));

    const headerTextStyle = computed(() => ({
      fontSize: props.content.headerFontSize || '16px',
      color: props.content.textColor || '#1F2937',
      margin: 0
    }));

    const viewStyles = computed(() => ({
      primaryColor: props.content.primaryColor || '#081B4E',
      backgroundColor: props.content.backgroundColor || '#FFFFFF',
      borderColor: props.content.borderColor || '#E5E7EB',
      textColor: props.content.textColor || '#1F2937',
      mutedTextColor: props.content.mutedTextColor || '#6B7280',
      todayHighlightColor: props.content.todayHighlightColor || '#EFF6FF',
      appointmentBg: props.content.appointmentBackgroundColor || '#DBEAFE',
      appointmentText: props.content.appointmentTextColor || '#1E40AF',
      blockBg: props.content.blockBackgroundColor || '#FEE2E2',
      blockText: props.content.blockTextColor || '#991B1B',
      cancelledOpacity: props.content.cancelledOpacity ?? 0.5,
      headerFontSize: props.content.headerFontSize || '16px',
      bodyFontSize: props.content.bodyFontSize || '14px'
    }));

    const getViewButtonStyle = (view) => {
      const isActive = currentView.value === view;
      return {
        backgroundColor: isActive ? (props.content.primaryColor || '#081B4E') : 'transparent',
        border: `1px solid ${props.content.borderColor || '#E5E7EB'}`,
        borderRadius: '8px',
        padding: '6px 12px',
        fontSize: props.content.bodyFontSize || '14px',
        color: isActive ? '#FFFFFF' : (props.content.textColor || '#1F2937'),
        cursor: 'pointer'
      };
    };

    // Utility functions
    const getStartOfWeek = (date) => {
      const d = new Date(date);
      const day = d.getDay();
      const diff = day === 0 ? -6 : 1 - day; // Monday as first day
      d.setDate(d.getDate() + diff);
      d.setHours(0, 0, 0, 0);
      return d;
    };

    const getStartOfMonth = (date) => {
      return new Date(date.getFullYear(), date.getMonth(), 1);
    };

    const getEndOfMonth = (date) => {
      return new Date(date.getFullYear(), date.getMonth() + 1, 0);
    };

    const updateDateRange = () => {
      let start, end;

      if (currentView.value === 'month') {
        start = getStartOfMonth(currentDate.value);
        end = getEndOfMonth(currentDate.value);
        end.setHours(23, 59, 59, 999);
      } else if (currentView.value === 'week') {
        start = getStartOfWeek(currentDate.value);
        end = new Date(start);
        end.setDate(end.getDate() + 6);
        end.setHours(23, 59, 59, 999);
      } else {
        start = new Date(currentDate.value);
        start.setHours(0, 0, 0, 0);
        end = new Date(currentDate.value);
        end.setHours(23, 59, 59, 999);
      }

      setStartDate(start.toISOString());
      setEndDate(end.toISOString());
      setCurrentDateVar(currentDate.value.toISOString());
    };

    // Event handlers
    const handleAppointmentClick = (appointment) => {
      setSelectedAppointment(appointment);

      if (isEditing.value) return;

      emit('trigger-event', {
        name: 'appointmentClick',
        event: {
          appointment: appointment,
          appointmentId: appointment.id
        }
      });
    };

    const handleEmptySlotClick = (slotInfo) => {
      if (isEditing.value) return;

      emit('trigger-event', {
        name: 'emptySlotClick',
        event: {
          date: slotInfo.date,
          time: slotInfo.time,
          timestamp: slotInfo.timestamp
        }
      });
    };

    const handleGoToToday = () => {
      if (isEditing.value) return;

      const oldDate = new Date(currentDate.value);
      currentDate.value = new Date();
      updateDateRange();

      emit('trigger-event', {
        name: 'dateChange',
        event: {
          date: currentDate.value.toISOString(),
          view: currentView.value,
          startDate: startDate.value,
          endDate: endDate.value
        }
      });
    };

    const handlePreviousPeriod = () => {
      if (isEditing.value) return;

      const newDate = new Date(currentDate.value);

      if (currentView.value === 'month') {
        newDate.setMonth(newDate.getMonth() - 1);
      } else if (currentView.value === 'week') {
        newDate.setDate(newDate.getDate() - 7);
      } else {
        newDate.setDate(newDate.getDate() - 1);
      }

      currentDate.value = newDate;
      updateDateRange();

      emit('trigger-event', {
        name: 'dateChange',
        event: {
          date: currentDate.value.toISOString(),
          view: currentView.value,
          startDate: startDate.value,
          endDate: endDate.value
        }
      });
    };

    const handleNextPeriod = () => {
      if (isEditing.value) return;

      const newDate = new Date(currentDate.value);

      if (currentView.value === 'month') {
        newDate.setMonth(newDate.getMonth() + 1);
      } else if (currentView.value === 'week') {
        newDate.setDate(newDate.getDate() + 7);
      } else {
        newDate.setDate(newDate.getDate() + 1);
      }

      currentDate.value = newDate;
      updateDateRange();

      emit('trigger-event', {
        name: 'dateChange',
        event: {
          date: currentDate.value.toISOString(),
          view: currentView.value,
          startDate: startDate.value,
          endDate: endDate.value
        }
      });
    };

    const handleChangeView = (view) => {
      if (isEditing.value) return;

      const previousView = currentView.value;
      currentView.value = view;
      setCurrentViewVar(view);
      updateDateRange();

      emit('trigger-event', {
        name: 'viewChange',
        event: {
          view: view,
          previousView: previousView
        }
      });
    };

    // Actions (exposed for workflows)
    const goToToday = () => {
      if (isEditing.value) return;
      currentDate.value = new Date();
      updateDateRange();
    };

    const goToDate = (dateString) => {
      if (isEditing.value) return;
      const date = new Date(dateString);
      if (!isNaN(date.getTime())) {
        currentDate.value = date;
        updateDateRange();
      }
    };

    const changeView = (view) => {
      if (isEditing.value) return;
      if (['month', 'week', 'day'].includes(view)) {
        currentView.value = view;
        setCurrentViewVar(view);
        updateDateRange();
      }
    };

    const nextPeriod = () => {
      handleNextPeriod();
    };

    const previousPeriod = () => {
      handlePreviousPeriod();
    };

    // Initialize
    updateDateRange();

    // Watch for view changes
    watch(currentView, () => {
      updateDateRange();
    });

    return {
      isEditing,
      currentDate,
      currentView,
      workingHoursStart,
      workingHoursEnd,
      timeSlotMinutes,
      todayButtonText,
      views,
      currentPeriodLabel,
      processedAppointments,
      processedBlocks,
      containerStyle,
      buttonStyle,
      headerTextStyle,
      viewStyles,
      getViewButtonStyle,
      handleAppointmentClick,
      handleEmptySlotClick,
      handleGoToToday,
      handlePreviousPeriod,
      handleNextPeriod,
      handleChangeView,
      // Actions
      goToToday,
      goToDate,
      changeView,
      nextPeriod,
      previousPeriod
    };
  }
};
</script>

<style scoped lang="scss">
.calendar-pro {
  width: 100%;
  background-color: var(--background-color);
  border-radius: 8px;
  overflow: hidden;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}

.calendar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid var(--border-color);
  flex-wrap: wrap;
  gap: 12px;

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: stretch;
  }
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;

  @media (max-width: 768px) {
    justify-content: space-between;
  }
}

.header-right {
  display: flex;
  align-items: center;

  @media (max-width: 768px) {
    justify-content: center;
  }
}

.btn-today,
.btn-nav,
.btn-view {
  transition: all 0.2s ease;
  font-weight: 500;

  &:hover {
    opacity: 0.8;
  }

  &:active {
    transform: scale(0.98);
  }
}

.nav-buttons {
  display: flex;
  gap: 4px;
}

.btn-nav {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  font-weight: bold;
}

.current-period {
  font-weight: 600;
  white-space: nowrap;

  @media (max-width: 768px) {
    order: -1;
    width: 100%;
    text-align: center;
  }
}

.view-switcher {
  display: flex;
  gap: 4px;
}

.btn-view {
  &.active {
    font-weight: 600;
  }
}

.calendar-body {
  padding: 16px;
}
</style>
