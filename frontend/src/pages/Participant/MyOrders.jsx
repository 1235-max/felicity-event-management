import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { merchandiseAPI } from '../../utils/api';
import Navbar from '../../components/Navbar';
import './MyOrders.css';

const MyOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await merchandiseAPI.getMyOrders();
      setOrders(response.data.orders);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Error loading your orders');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Pending Approval':
        return 'status-pending';
      case 'Successful':
      case 'Approved':
        return 'status-approved';
      case 'Rejected':
        return 'status-rejected';
      default:
        return '';
    }
  };

  const viewTicket = (order) => {
    setSelectedOrder(order);
  };

  const closeModal = () => {
    setSelectedOrder(null);
  };

  const downloadQR = () => {
    if (selectedOrder?.ticket?.qrCode) {
      const link = document.createElement('a');
      link.href = selectedOrder.ticket.qrCode;
      link.download = `ticket-${selectedOrder.ticket.ticketId}.png`;
      link.click();
    }
  };

  return (
    <>
      <Navbar role="participant" />
      <div className="my-orders-page">
        <div className="my-orders-container">
          <h1>📦 My Merchandise Orders</h1>

          {loading ? (
            <div className="loading">Loading your orders...</div>
          ) : orders.length === 0 ? (
            <div className="no-orders">
              <p>You haven't placed any merchandise orders yet.</p>
            </div>
          ) : (
            <div className="orders-grid">
              {orders.map((order) => (
                <div key={order._id} className="order-card">
                  <div className="order-header">
                    <h3>{order.event?.eventName || 'Event'}</h3>
                    <span className={`status-badge ${getStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                  </div>

                  <div className="order-details">
                    <div className="detail-row">
                      <span className="label">Order ID:</span>
                      <span className="value">{order._id.slice(-8)}</span>
                    </div>

                    <div className="detail-row">
                      <span className="label">Variant:</span>
                      <span className="value">{order.orderDetails.variant}</span>
                    </div>

                    {order.orderDetails.size && (
                      <div className="detail-row">
                        <span className="label">Size:</span>
                        <span className="value">{order.orderDetails.size}</span>
                      </div>
                    )}

                    {order.orderDetails.color && (
                      <div className="detail-row">
                        <span className="label">Color:</span>
                        <span className="value">{order.orderDetails.color}</span>
                      </div>
                    )}

                    <div className="detail-row">
                      <span className="label">Quantity:</span>
                      <span className="value">{order.orderDetails.quantity}</span>
                    </div>

                    <div className="detail-row">
                      <span className="label">Total:</span>
                      <span className="value">₹{order.orderDetails.price * order.orderDetails.quantity}</span>
                    </div>

                    <div className="detail-row">
                      <span className="label">Ordered On:</span>
                      <span className="value">
                        {new Date(order.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                    </div>

                    {order.rejectionReason && (
                      <div className="rejection-reason">
                        <strong>Rejection Reason:</strong>
                        <p>{order.rejectionReason}</p>
                      </div>
                    )}
                  </div>

                  {order.status === 'Successful' && order.ticket && (
                    <button className="view-ticket-btn" onClick={() => viewTicket(order)}>
                      🎫 View Ticket & QR Code
                    </button>
                  )}

                  {order.status === 'Pending Approval' && (
                    <div className="pending-note">
                      <small>⏳ Waiting for organizer approval</small>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Ticket Modal */}
        {selectedOrder && (
          <div className="modal-overlay" onClick={closeModal}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <button className="close-btn" onClick={closeModal}>×</button>
              
              <div className="ticket-display">
                <h2>🎫 Your Ticket</h2>
                
                <div className="ticket-info">
                  <h3>{selectedOrder.event?.eventName}</h3>
                  <p className="ticket-id">Ticket ID: {selectedOrder.ticket.ticketId}</p>
                  
                  <div className="ticket-details">
                    <div className="detail">
                      <span className="label">Variant:</span>
                      <span>{selectedOrder.orderDetails.variant}</span>
                    </div>
                    {selectedOrder.orderDetails.size && (
                      <div className="detail">
                        <span className="label">Size:</span>
                        <span>{selectedOrder.orderDetails.size}</span>
                      </div>
                    )}
                    {selectedOrder.orderDetails.color && (
                      <div className="detail">
                        <span className="label">Color:</span>
                        <span>{selectedOrder.orderDetails.color}</span>
                      </div>
                    )}
                    <div className="detail">
                      <span className="label">Quantity:</span>
                      <span>{selectedOrder.orderDetails.quantity}</span>
                    </div>
                  </div>

                  <div className="qr-code-container">
                    <p className="qr-instruction">Present this QR code to collect your merchandise</p>
                    <img 
                      src={selectedOrder.ticket.qrCode} 
                      alt="Ticket QR Code" 
                      className="qr-code"
                    />
                    <button className="download-qr-btn" onClick={downloadQR}>
                      Download QR Code
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default MyOrders;
