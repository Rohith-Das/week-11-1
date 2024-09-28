<script>
$(document).ready(function() {
    // Handle address form submission (unchanged)
    $('#addAddressForm').on('submit', function(e) {
        // ... (keep existing code)
    });

    // Handle edit address form submission (unchanged)
    $('form[id^="editAddressForm_"]').on('submit', function(e) {
        // ... (keep existing code)
    });

    // Handle address delete (unchanged)
    $('a.btn-icon.delete').on('click', function(e) {
        // ... (keep existing code)
    });

    // Initialize Razorpay
    var razorpay = new Razorpay({
        key: '<%= razorpayKeyId %>'
    });

    // Handle order form submission
    $('#placeOrderForm').on('submit', async function(e) {
        e.preventDefault();
        let coupon = document.getElementById("couponCode").value;
        const formData = new FormData(this);
        formData.append('appliedCouponCode', coupon);

        const paymentMethod = formData.get('paymentMethod');

        // Check if wallet payment is selected (unchanged)
        if (paymentMethod === 'Wallet Cash') {
            // ... (keep existing wallet check code)
        }

        // For Razorpay payment
        if (paymentMethod === 'Razorpay') {
            // First, create an order on the server
            const orderResponse = await fetch('/place', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(Object.fromEntries(formData)),
            });
            const orderData = await orderResponse.json();

            if (!orderData.success) {
                Swal.fire({
                    icon: 'error',
                    title: 'Order Creation Failed',
                    text: orderData.message,
                });
                return;
            }

            // Configure Razorpay options
            var options = {
                key: '<%= razorpayKeyId %>',
                amount: orderData.orderDetails.totalAmount * 100, // Amount in paise
                currency: "INR",
                name: "Your Company Name",
                description: "Order Payment",
                order_id: orderData.razorpayOrderId,
                handler: async function (response) {
                    // On successful payment, send payment details to server for verification
                    const verificationResponse = await fetch('/place', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            ...Object.fromEntries(formData),
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_signature: response.razorpay_signature
                        }),
                    });
                    const verificationResult = await verificationResponse.json();

                    if (verificationResult.success) {
                        Swal.fire({
                            icon: 'success',
                            title: 'Payment Successful',
                            text: 'Your order has been placed successfully!',
                        }).then(() => {
                            window.location.href = `/orderSummary/${verificationResult.orderId}`;
                        });
                    } else {
                        Swal.fire({
                            icon: 'error',
                            title: 'Payment Verification Failed',
                            text: verificationResult.message,
                        });
                    }
                },
                prefill: {
                    name: "<%= userData.name %>",
                    email: "<%= userData.email %>",
                    contact: "<%= userData.phoneNumber %>"
                },
                theme: {
                    color: "#3399cc"
                }
            };

            // Open Razorpay payment form
            var rzp1 = new Razorpay(options);
            rzp1.open();
            return;
        }

        // For other payment methods
        const response = await fetch('/place', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(Object.fromEntries(formData)),
        });
        const result = await response.json();

        if (result.success) {
            Swal.fire({
                title: 'Order Placed!',
                text: `Your order has been placed successfully. Total: $${result.orderDetails.totalAmount.toFixed(2)}`,
                icon: 'success',
                confirmButtonText: 'OK'
            }).then(() => {
                window.location.href = `/orderSummary/${result.orderId}`;
            });
        } else {
            Swal.fire({
                title: 'Order Failed!',
                text: result.message,
                icon: 'error',
                confirmButtonText: 'OK'
            });
        }
    });

    // ... (keep any other existing code)
});
</script>