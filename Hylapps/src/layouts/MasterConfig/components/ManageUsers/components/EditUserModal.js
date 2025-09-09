import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import Modal from 'react-modal';
import PropTypes from 'prop-types';

const EditUserModal = ({ isOpen, onRequestClose, selectedUser, isAdmin, onSuccess }) => {
  const [userData, setUserData] = useState({
    firstName: '',
    lastName: '',
    email: '',
  });
    const [errors, setErrors] = useState({});
  

  const [isLoading, setIsLoading] = useState(false);
  const baseURL = process.env.REACT_APP_API_BASE_URL;

  useEffect(() => {
    console.log(selectedUser);
    if (selectedUser) {
      setUserData({
        firstName: selectedUser.userFirstName,
        lastName: selectedUser.userLastName,
        email: selectedUser.userEmail,
      });
    }
  }, [selectedUser]);

  const handleChange = (e) => {
    const { name, value } = e.target;

     const cleanedValue = name === 'email' ? value.trim().toLowerCase() : value;

    setUserData((prevData) => ({
      ...prevData,
      [name]: cleanedValue,
    }));

 // Optional: Live validation
  if (name === 'email') {
    setErrors((prevErrors) => ({
      ...prevErrors,
      email: validateEmail(cleanedValue) ? '' : 'Invalid email',
    }));
  }
    

  };

   const validateEmail = (email) => {
    // This regex checks for a more robust email format
    const regex = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/;
    return regex.test(email);
  };

  const validateForm = () => {
    const newErrors = {};

    if (!userData.firstName) newErrors.firstName = 'Required';
    if (!userData.lastName) newErrors.lastName = 'Required';
    if (!validateEmail(userData.email)) newErrors.email = 'Invalid email';
    

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
     if (!validateForm()) return;
    setIsLoading(true);

    try {
    
      const emailChanged = userData.email !== selectedUser.userEmail;

if (emailChanged) {
  const emailCheckResponse = await axios.get(`${baseURL}/api/settings/users-management/users/check-email`, {
    params: { email: userData.email },
  });

  if (emailCheckResponse.data.exists) {
    Swal.fire('Error', 'Email already exists!', 'error');
    setIsLoading(false);
    return;
  }
}


        await axios.put(`${baseURL}/api/settings/users-management/edit-user/${selectedUser._id}`, {
          ...userData,
          isAdmin: selectedUser.isAdmin,
        });

  setErrors({});  // Clear error messages

      Swal.fire('Success', 'User updated successfully!', 'success');
      onSuccess(); // Trigger success callback to reload data
      onRequestClose(); // Close the modal
    } catch (error) {
      console.error(error);
      Swal.fire('Error', 'Failed to update user.', 'error');
    } finally {
      setIsLoading(false);
    }
  };


  const modalStyle = {
    overlay: {
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      zIndex: 9999,
    },
    content: {
      background: '#fff',
      borderRadius: '8px',
      maxWidth: '600px',
      width: '90%',
      padding: '20px',
      top: '50%',
      left: '50%',
      right: 'auto',
      bottom: 'auto',
      transform: 'translate(-50%, -50%)',
      boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
    },
  };

  const inputStyle = {
    width: '100%',
    padding: '10px',
    border: '1px solid #ccc',
    borderRadius: '5px',
    fontSize: '14px',
    marginBottom: '5px',
    boxSizing: 'border-box',
  };

  const labelStyle = {
    display: 'block',
    fontWeight: '500',
    color: '#4b5563',
    marginBottom: '5px',
  };

  const errorTextStyle = {
  color: 'red',
  fontSize: '13px',
  marginTop: '2px',
  marginBottom: '10px',
  display: 'block',
};


  const btnStyle = {
    padding: '10px 20px',
    fontSize: '16px',
    borderRadius: '5px',
    border: 'none',
    cursor: 'pointer',
    color: 'white',
    backgroundColor: '#0F67B1',
    marginTop: '10px',
  };

  const cancelBtnStyle = {
  ...btnStyle,
  backgroundColor: '#6B7280', // Tailwind's gray-500
  marginLeft: '10px',
};



  return (
    <Modal isOpen={isOpen} onRequestClose={onRequestClose} style={modalStyle}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
      <h2>{isAdmin ? 'Edit Admin' : 'Edit User'}</h2>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label style={labelStyle}>First Name</label>
            <input
              type="text"
              name="firstName"
              value={userData.firstName}
              onChange={handleChange}
              required
              style={inputStyle}
            />
        {errors.firstName && <span style={errorTextStyle} >{errors.firstName}</span>}

          </div>
          <div className="form-group">
            <label style={labelStyle}>Last Name</label>
            <input
              type="text"
              name="lastName"
              value={userData.lastName}
              onChange={handleChange}
              required
              style={inputStyle}
            />
        {errors.lastName && <span style={errorTextStyle} >{errors.lastName}</span>}

          </div>
          <div className="form-group">
            <label style={labelStyle}>Email</label>
            <input
              type="email"
              name="email"
              value={userData.email}
              onChange={handleChange}
              required
              style={inputStyle}
            />
        {errors.email && <span style={errorTextStyle} >{errors.email}</span>}

          </div>



                  <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
            <button
              type="submit"
              disabled={isLoading}
              style={btnStyle}
            >
              {isLoading ? 'Saving...' : 'Save Changes'}
            </button>
            <button
              type="button"
              onClick={onRequestClose}
              style={cancelBtnStyle}
            >
              Cancel
            </button>
          </div>

        </form>
      </div>
    </Modal>
  );
};


EditUserModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onRequestClose: PropTypes.func.isRequired,
  selectedUser: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    isAdmin: PropTypes.bool,
    userFirstName: PropTypes.string,
    userLastName: PropTypes.string,
    userEmail: PropTypes.string,
  }),
  isAdmin: PropTypes.bool,
  onSuccess: PropTypes.func.isRequired,
};

export default EditUserModal;
