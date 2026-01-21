# Calendar Pro - WeWeb Component

Professional calendar component for WeWeb with Google Calendar-like functionality.

## Features

### Views
- **Month View**: Full month grid with day events
- **Week View**: 7-day week with hourly time slots
- **Day View**: Single day detailed view with hourly breakdown

### Functionality
- Multiple view switching (Month/Week/Day)
- Navigation (Previous/Next/Today)
- Appointment display with status indicators
- Schedule blocks support
- Responsive design for mobile/tablet/desktop
- Click handlers for appointments and empty slots
- Component variables exposed for WeWeb workflows

### Collections Support
Bind the following collections from your database:
- **Appointments** (agendamentos)
- **Blocks** (bloqueios_agenda)
- **Services** (servicos)
- **Professionals** (usuarios_profissionais)
- **Clients** (clientes)

### Status Indicators
- **Pending**: Circle outline icon
- **Confirmed**: Checkmark icon
- **Cancelled**: X icon with reduced opacity

## Installation

1. Copy the component to your WeWeb components folder
2. Run `npm install` (if needed)
3. Import in WeWeb editor

## Configuration

### Collections Binding

In WeWeb editor, bind your collections with filters:

```
agendamentos:
  - data_inicio >= [variable: uid-startDate]
  - data_inicio <= [variable: uid-endDate]

bloqueios_agenda:
  - data_inicio >= [variable: uid-startDate]
  - data_inicio <= [variable: uid-endDate]
```

### Properties

#### Settings
- **Default View**: month, week, or day
- **Working Hours Start**: 0-23 (default: 6)
- **Working Hours End**: 0-23 (default: 22)
- **Time Slot Duration**: 15-120 minutes (default: 30)

#### Styles
- Primary Color (default: #081B4E)
- Background Color (default: #FFFFFF)
- Border Color (default: #E5E7EB)
- Text Colors
- Appointment Colors
- Block Colors
- Font Sizes (responsive)

### Component Variables

The component exposes these variables for use in workflows:

- `[uid]-startDate`: Start date of current view period
- `[uid]-endDate`: End date of current view period
- `[uid]-currentView`: Current view (month/week/day)
- `[uid]-currentDate`: Selected date (ISO string)
- `[uid]-selectedAppointment`: Last clicked appointment object

### Events

- **appointmentClick**: Triggered when clicking an appointment
  - Returns: appointment object, appointmentId
- **emptySlotClick**: Triggered when clicking empty time slot
  - Returns: date, time, timestamp
- **dateChange**: Triggered when navigating to different date
  - Returns: date, view, startDate, endDate
- **viewChange**: Triggered when switching views
  - Returns: view, previousView

### Actions

Call these actions from workflows:

- `goToToday()`: Navigate to today's date
- `goToDate(dateString)`: Navigate to specific date
- `changeView(view)`: Change to 'month', 'week', or 'day'
- `nextPeriod()`: Navigate to next period
- `previousPeriod()`: Navigate to previous period

## Usage Example

### Basic Setup

1. Add Calendar Pro component to page
2. Bind collections in settings panel
3. Configure working hours and colors
4. Set up workflows for click events

### Workflow Examples

**On Appointment Click** → Open appointment details modal
**On Empty Slot Click** → Open new appointment form with pre-filled date/time
**On Date Change** → Refresh appointments collection with new date range

## Responsive Behavior

- **Desktop**: Full calendar with all features
- **Tablet**: Optimized grid spacing
- **Mobile**: Simplified layout, horizontal scroll for week view

## Database Schema

Expected fields in collections:

### Appointments (agendamentos)
- `id`: Unique identifier
- `data_inicio`: Start datetime (required)
- `data_fim`: End datetime
- `titulo`: Title
- `status`: 'pending', 'confirmed', 'cancelled'
- `servico_id`: Service FK
- `profissional_id`: Professional FK
- `cliente_id`: Client FK
- `nome_cliente`: Client name (fallback)
- `location`: Location text

### Blocks (bloqueios_agenda)
- `id`: Unique identifier
- `data_inicio`: Start datetime (required)
- `data_fim`: End datetime
- `motivo`: Reason/description
- `dia_inteiro`: All day boolean

### Services (servicos)
- `id`: Unique identifier
- `nome_servico`: Service name

### Clients (clientes)
- `id`: Unique identifier
- `nome`: Client name

## Customization

All colors, fonts, and spacing are configurable through the WeWeb editor properties panel. The component follows your design system with:

- Border radius: 8px
- Button padding: 6px 12px
- Default fonts: 16px (headers), 14px (body)
- Primary color: #081B4E
- Background: White

## Support

For issues or questions, check the component documentation or reach out to support.
