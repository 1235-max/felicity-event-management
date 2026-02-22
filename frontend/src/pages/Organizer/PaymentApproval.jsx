import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { merchandiseAPI } from '../../utils/api';
import Navbar from '../../components/Navbar';
import './PaymentApproval.css';

const PaymentApproval = () => {
  const { id: eventId } = useParams();
  const [orders, setOrders] = useState([]);
  const [counts, setCounts] = useState({});
  const [selectedStatus, setSelectedStatus] = useState('Pending Approval');
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);

  useEffect(() => {
    fetchOrders();
  }, [eventId, selectedStatus]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await merchandiseAPI.getEventOrders(eventId, selectedStatus);
      setOrders(response.data.orders);
      setCounts(response.data.counts);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Error loading orders');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (orderId) => {
    if (!confirm('Approve this payment? This will generate a ticket and send confirmation email.')) {
      return;
    }

    try {
      await merchandiseAPI.approveOrder(orderId);
      toast.success('✅ Payment approved! Ticket generated and email sent.');
      fetchOrders();
      setSelectedOrder(null);
    } catch (error) {
      console.error('Approval error:', error);
      toast.error(error.response?.data?.message || 'Error approving order');
    }
  };

  const handleReject = async (orderId) => {
    const reason = prompt('Enter rejection reason (optional):');
    if (reason === null) return; // Cancelled

    try {
      await merchandiseAPI.rejectOrder(orderId, reason);
      toast.success('Payment rejected');
      fetchOrders();
      setSelectedOrder(null);
    } catch (error) {
      console.error('Rejection error:', error);
      toast.error('Error rejecting order');
    }
  };

  const viewOrderDetails = (order) => {
    setSelectedOrder(order);
  };

  const closeModal = () => {
    setSelectedOrder(null);
  };

  return (
    <>
      <Navbar role="organizer" />
      <div className="payment-approval-page">
        <div className="payment-approval-container">
          <h1>💳 Payment Approval</h1>
        
        {/* Status Filter Tabs */}
        <div className="filter-tabs">
          <button
            className={selectedStatus === 'Pending Approval' ? 'active' : ''}
            onClick={() => setSelectedStatus('Pending Approval')}
          >
            Pending {counts.pending > 0 && <span className="badge">{counts.pending}</span>}
          </button>
          <button
            className={selectedStatus === 'Successful' ? 'active' : ''}
            onClick={() => setSelectedStatus('Successful')}
          >
            Approved {counts.successful > 0 && <span className="badge">{counts.successful}</span>}
          </button>
          <button
            className={selectedStatus === 'Rejected' ? 'active' : ''}
            onClick={() => setSelectedStatus('Rejected')}
          >
            Rejected {counts.rejected > 0 && <span className="badge">{counts.rejected}</span>}
          </button>
        </div>

        {/* Orders List */}
        {loading ? (
          <div className="loading">Loading orders...</div>
        ) : orders.length === 0 ? (
          <div className="no-orders">
            <p>No orders found</p>
          </div>
        ) : (
          <div className="orders-grid">
            {orders.map((order) => (
              <div key={order._id} className="order-card">
                <div className="order-header">
                  <div className="order-info">
                    <h3>{order.participant.name}</h3>
                    <p>{order.participant.email}</p>
                  </div>
                  <span className={`status-badge ${order.status.toLowerCase().replace(' ', '-')}`}>
                    {order.status}
                  </span>
                </div>

                <div className="order-details">
                  <div className="detail-row">
                    <span className="label">Variant:</span>
                    <span>{order.orderDetails.variant || 'Default'}</span>
                  </div>
                  {order.orderDetails.size && (
                    <div className="detail-row">
                      <span className="label">Size:</span>
                      <span>{order.orderDetails.size}</span>
                    </div>
                  )}
                  {order.orderDetails.color && (
                    <div className="detail-row">
                      <span className="label">Color:</span>
                      <span>{order.orderDetails.color}</span>
                    </div>
                  )}
                  <div className="detail-row">
                    <span className="label">Quantity:</span>
                    <span>{order.orderDetails.quantity}</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Amount:</span>
                    <span className="price">₹{order.orderDetails.price}</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Ordered:</span>
                    <span>{new Date(order.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>

                {order.paymentProof && (
                  <div className="payment-proof">
                    <button
                      onClick={() => viewOrderDetails(order)}
                      className="btn-view-proof"
                    >
                      📄 View Payment Proof
                    </button>
                  </div>
                )}

                {order.status === 'Pending Approval' && (
                  <div className="order-actions">
                    <button
                      onClick={() => handleApprove(order._id)}
                      className="btn btn-approve"
                    >
                      ✓ Approve
                    </button>
                    <button
                      onClick={() => handleReject(order._id)}
                      className="btn btn-reject"
                    >
                      ✗ Reject
                    </button>
                  </div>
                )}

                {order.status === 'Rejected' && order.rejectionReason && (
                  <div className="rejection-reason">
                    <strong>Reason:</strong> {order.rejectionReason}
                  </div>
                )}

                {order.status === 'Successful' && order.ticketId && (
                  <div className="ticket-info">
                    <strong>Ticket ID:</strong> {order.ticketId}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Payment Proof Modal */}
      {selectedOrder && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={closeModal}>×</button>
            <h2>Payment Proof</h2>
            <div className="modal-body">
              <div className="participant-info">
                <p><strong>Name:</strong> {selectedOrder.participant.name}</p>
                <p><strong>Email:</strong> {selectedOrder.participant.email}</p>
                <p><strong>Amount:</strong> ₹{selectedOrder.orderDetails.price}</p>
              </div>
              <div className="proof-image">
                <img src={selectedOrder.paymentProof} alt="Payment proof" />
              </div>
              {selectedOrder.status === 'Pending Approval' && (
                <div className="modal-actions">
                  <button
                    onClick={() => handleApprove(selectedOrder._id)}
                    className="btn btn-approve"
                  >
                    ✓ Approve Payment
                  </button>
                  <button
                    onClick={() => handleReject(selectedOrder._id)}
                    className="btn btn-reject"
                  >
                    ✗ Reject Payment
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      </div>
    </>
  );
};

export default PaymentApproval;
