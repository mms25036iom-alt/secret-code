import { MY_APPOINTMENTS_REQUEST, MY_APPOINTMENTS_SUCCESS, MY_APPOINTMENTS_FAIL, CREATE_APPOINTMENT_REQUEST, CREATE_APPOINTMENT_SUCCESS, CREATE_APPOINTMENT_FAIL, ALL_DOCTORS_REQUEST, ALL_DOCTORS_SUCCESS, ALL_DOCTORS_FAIL, CLEAR_ERRORS } from "../constants/appointmentConstants";
import axios from '../axios';

export const createAppointment = (doctorId, day, time, description, symptoms, symptomsAudio = null) => async (dispatch) => {
    try {
        dispatch({ type: CREATE_APPOINTMENT_REQUEST });
        
        const config = {
            headers: { "Content-Type": "application/json" }
        };
        console.log('Creating appointment:', { doctorId, day, time, description, symptoms, symptomsAudio: symptomsAudio ? 'Audio URL present' : 'No audio' });

        const { data } = await axios.post(
            '/appointment/new',
            { 
                doctor: doctorId,
                description,
                symptoms,
                symptomsAudio,
                day,
                time 
            },
            config
        );

        dispatch({ type: CREATE_APPOINTMENT_SUCCESS, payload: data });
    } catch (error) {
        dispatch({
            type: CREATE_APPOINTMENT_FAIL,
            payload: error.response?.data?.message || "Appointment creation failed"
        });
    }
};

export const myAppointments = () => async (dispatch) => {
    try {
        dispatch({ type: MY_APPOINTMENTS_REQUEST });
        console.log('Fetching appointments from API...');
        const { data } = await axios.get('/appointment/my')
        console.log('Appointments API response:', data);

        dispatch({ type: MY_APPOINTMENTS_SUCCESS, payload: data.appointments })
    } catch (error) {
        console.error('Error fetching appointments:', error);
        dispatch({
            type: MY_APPOINTMENTS_FAIL,
            payload: error.response?.data?.message || 'Failed to fetch appointments'
        })
    }
}

// export const allAppointments = () => async (dispatch) => {
//     try {
//         dispatch({ type: ALL_ORDERS_REQUEST });
//         const { data } = await axios.get('/')

//         dispatch({ type: ALL_ORDERS_SUCCESS, payload: data.orders })
//     } catch (error) {
//         dispatch({
//             type: ALL_ORDERS_FAIL,
//             payload: error.response.data.message
//         })
//     }
// }

export const allDoctors = () => async (dispatch) => {
    try {
        dispatch({ type: ALL_DOCTORS_REQUEST });
        const { data } = await axios.get('/doctors')

        dispatch({ type: ALL_DOCTORS_SUCCESS, payload: data.doctors })
    } catch (error) {
        dispatch({
            type: ALL_DOCTORS_FAIL,
            payload: error.response.data.message
        })
    }
}

export const getAvailableSlots = (doctorId, date) => async (dispatch) => {
    try {
        dispatch({ type: 'GET_AVAILABLE_SLOTS_REQUEST' });
        const { data } = await axios.get(`/appointment/slots/${doctorId}/${date}`)

        dispatch({ type: 'GET_AVAILABLE_SLOTS_SUCCESS', payload: data })
    } catch (error) {
        dispatch({
            type: 'GET_AVAILABLE_SLOTS_FAIL',
            payload: error.response?.data?.message || "Failed to fetch available slots"
        })
    }
}

// export const getOrderDetails = (id) => async (dispatch) => {
//     try {
//         dispatch({ type: ORDER_DETAILS_REQUEST });
//         const { data } = await axios.get(`/api/v1/order/${id}`);

//         dispatch({ type: ORDER_DETAILS_SUCCESS, payload: data.order });
//     } catch (error) {
//         dispatch({
//             type: ORDER_DETAILS_FAIL,
//             payload: error.response.data.message,
//         });
//     }
// };

// Update appointment status (for doctors to accept/complete appointments)
export const updateAppointmentStatus = (appointmentId, status) => async (dispatch) => {
    try {
        dispatch({ type: 'UPDATE_APPOINTMENT_STATUS_REQUEST' });
        
        const config = {
            headers: { "Content-Type": "application/json" }
        };

        const { data } = await axios.put(
            `/appointment/${appointmentId}/status`,
            { status },
            config
        );

        dispatch({ 
            type: 'UPDATE_APPOINTMENT_STATUS_SUCCESS', 
            payload: data 
        });
        
        return data;
    } catch (error) {
        dispatch({
            type: 'UPDATE_APPOINTMENT_STATUS_FAIL',
            payload: error.response?.data?.message || "Failed to update appointment status"
        });
        throw error;
    }
};

// For clearing errors
export const clearErrors = () => async (dispatch) => {
    dispatch({
        type: CLEAR_ERRORS
    })
}