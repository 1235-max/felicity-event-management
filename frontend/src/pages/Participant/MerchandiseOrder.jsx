import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { eventAPI, merchandiseAPI } from '../../utils/api';
import Navbar from '../../components/Navbar';
import './MerchandiseOrder.css';

const MerchandiseOrder = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [orderData, setOrderData] = useState({
    variant: '',
    size: '',
    color: '',
    quantity: 1
  });
  const [paymentProof, setPaymentProof] = useState('');
  const [formResponses, setFormResponses] = useState({});

  useEffect(() => {
    fetchEvent();
  }, [eventId]);

  const fetchEvent = async () => {
    try {
      const response = await eventAPI.getById(eventId);
      console.log('Event response:', response.data); // Debug log
      // Handle both response.data and response.data.event structures
      const eventData = response.data.event || response.data;
      setEvent(eventData);
    } catch (error) {
      toast.error('Error loading event');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPaymentProof(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFormChange = (fieldId, value) => {
    setFormResponses({
      ...formResponses,
      [fieldId]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!paymentProof) {
      toast.error('Please upload payment proof');
      return;
    }

    try {
      setLoading(true);
      
      // Calculate price
      let price = event.merchandiseDetails.price || 0;
      if (event.merchandiseDetails.variants?.length > 0) {
        const selectedVariant = event.merchandiseDetails.variants.find(v => v.name === orderData.variant);
        price = selectedVariant?.price || price;
      }

      await merchandiseAPI.placeOrder({
        eventId,
        orderDetails: {
          ...orderData,
          price: price * orderData.quantity
        },
        paymentProof,
        formResponses
      });

      toast.success('Order placed! Awaiting admin approval.');
      navigate('/participant/dashboard');
    } catch (error) {
      console.error('Order error:', error);
      toast.error(error.response?.data?.message || 'Error placing order');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <>
        <Navbar role="participant" />
        <div className="loading">Loading...</div>
      </>
    );
  }

  if (!event) {
    return (
      <>
        <Navbar role="participant" />
        <div className="error">Event not found</div>
      </>
    );
  }

  return (
    <>
      <Navbar role="participant" />
      <div className="merchandise-order-page">
      <div className="merchandise-order-container">
        <button onClick={() => navigate(-1)} className="back-btn">← Back</button>
        
        <div className="order-header">
          <h1>{event.eventName}</h1>
          <p>{event.eventDescription}</p>
        </div>

        <form onSubmit={handleSubmit} className="order-form">
          <div className="merchandise-details">
            <h2>Merchandise Details</h2>
            
            {event.merchandiseDetails?.variants?.length > 0 && (
              <div className="form-group">
                <label>Variant *</label>
                <select
                  value={orderData.variant}
                  onChange={(e) => setOrderData({ ...orderData, variant: e.target.value })}
                  required
                >
                  <option value="">Select Variant</option>
                  {event.merchandiseDetails.variants.map((v, idx) => (
                    <option key={idx} value={v.name}>
                      {v.name} - ₹{v.price} (Stock: {v.stockQuantity})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {event.merchandiseDetails?.sizes?.length > 0 && (
              <div className="form-group">
                <label>Size *</label>
                <select
                  value={orderData.size}
                  onChange={(e) => setOrderData({ ...orderData, size: e.target.value })}
                  required
                >
                  <option value="">Select Size</option>
                  {event.merchandiseDetails.sizes.map((size, idx) => (
                    <option key={idx} value={size}>{size}</option>
                  ))}
                </select>
              </div>
            )}

            {event.merchandiseDetails?.colors?.length > 0 && (
              <div className="form-group">
                <label>Color *</label>
                <select
                  value={orderData.color}
                  onChange={(e) => setOrderData({ ...orderData, color: e.target.value })}
                  required
                >
                  <option value="">Select Color</option>
                  {event.merchandiseDetails.colors.map((color, idx) => (
                    <option key={idx} value={color}>{color}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="form-group">
              <label>Quantity *</label>
              <input
                type="number"
                min="1"
                max={event.stockQuantity || 999}
                value={orderData.quantity}
                onChange={(e) => setOrderData({ ...orderData, quantity: parseInt(e.target.value) })}
                required
              />
            </div>
          </div>

          {/* Payment Proof Upload */}
          <div className="payment-section">
            <h2>Payment Proof *</h2>
            <p className="payment-info">
              Please upload a screenshot or photo of your payment confirmation.
              Supported formats: JPG, PNG, PDF
            </p>
            <div className="form-group">
              <input
                type="file"
                accept="image/*,.pdf"
                onChange={handleImageUpload}
                required
              />
              {paymentProof && (
                <div className="payment-preview">
                  <img src={paymentProof} alt="Payment proof" />
                </div>
              )}
            </div>
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Placing Order...' : 'Place Order'}
          </button>
        </form>
      </div>
    </div>
    </>
  );
};

export default MerchandiseOrder;
