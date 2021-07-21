pragma solidity ^0.4.25;

//contract deployed each time a product is or products are listed on the market
//product info will be held on mongodb

contract Lifecycle {
   
    address public buyer;
    address public seller;
    
    uint public value;
    uint timePurchased;
  
   enum Status { Listed, Pending, Shipped, Accepted, Rejected, Cancelled, Inactive }
    Status public status;

    
    modifier onlySeller() {
        require(msg.sender == seller, 'Only seller can cancel product listing');
        _;
    }
    
     modifier onlyBuyer() {
        require(msg.sender == buyer, 'Only buyer can cancel product purchase');
        _;
    }
    
    event ItemPurchased(address seller);
    event ItemShipped(uint timestamp);
    event ItemCancelled(uint timestamp);
    event PendingItemCancelled(bytes32 reason);
    event ItemAccepted();
    event ItemRejected(bytes32 reason);
    
    constructor() public payable {
        value = (msg.value / 2);
        
        //include statement here about requiring to be even
        seller = msg.sender;
    }
    
    function cancelListing() public onlySeller {
        require(status == Status.Listed);
    
        status = Status.Cancelled;
    }
    
    function pendingCancellation(bytes32 _reason) public onlySeller {
        require(status == Status.Pending, 'Item must be pending to cancel transaction here.');
        
        emit PendingItemCancelled(_reason);
        
        status = Status.Cancelled;
        
        buyer.transfer(value * 2);
    }
    
    function confirmPurchse() public payable {
        require(status == Status.Listed, 'Product not up for sale or currently pending.');
        require(msg.value == value * 2, 'Please deposit 2x the amount of the priced item for collateral.');
        require(msg.sender != seller, 'Seller cannot purchase their own item.');
        
        emit ItemPurchased(msg.sender);
        
        status = Status.Pending;
        seller = msg.sender;
        timePurchased = block.timestamp;
    }
    
    function confirmShipped() public onlySeller {
        require(status == Status.Pending, 'Item is not pending.');
        
        emit ItemShipped(block.timestamp);
        
        status = Status.Shipped;
    }
    
    //in the case the seller hasn't shipped out for >= 11 days
    function cancelPurchase() public onlyBuyer {
        require(status == Status.Pending, 'Product needs to be pending.');
        require(block.timestamp >= (timePurchased + 950400), 'Seller has 11 days to send out item, has not yet been 11 days.');
        
        emit ItemCancelled(block.timestamp);
        status = Status.Cancelled;
        
        buyer.transfer(value * 2);
    }
    
    function acceptProduct() public onlyBuyer {
        require(status == Status.Shipped, "Item hasn't shipped.");
        
        emit ItemAccepted();
        status = Status.Accepted;
        
        buyer.transfer(value);
    }
 
    function rejectProduct(bytes32 rejectionDesc) public onlyBuyer {
        require(status == Status.Shipped, 'Item needs to have shipped to reject.');
        
        emit ItemRejected(rejectionDesc);
        status = Status.Rejected;
        
        buyer.transfer(value * 2);
    }
    
    function sellerWithdraw() public onlySeller {
        require(status == Status.Accepted || status == Status.Cancelled, 'Funds are not available for withdraw.');
        
        status = Status.Inactive;
    
        seller.transfer(value * 3);
    }
}