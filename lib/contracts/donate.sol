// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract DonationContract {
    address public admin;

    mapping(address => Donor) public donors;
    mapping(address => Charity) public charities;
    mapping(address => Subscription[]) public subscriptions;

    struct Donor {
        string name;
        uint256 totalDonated;
        uint256 lastDonation;
        address[] supportedCharities;
    }

    struct Charity {
        string name;
        string description;
        address wallet;
        uint256 totalReceived;
        uint256 lastWithdrawal;
        bool verified;
    }

    struct Subscription {
        address charity;
        uint256 amount;
        uint256 interval; // in seconds
        uint256 nextPayment;
    }

    modifier onlyAdmin() {
        require(msg.sender == admin, "Not authorized");
        _;
    }

    constructor() {
        admin = msg.sender;
    }

    function registerDonor(string memory name) external {
        require(bytes(name).length > 0, "Name cannot be empty");
        donors[msg.sender].name = name;
    }

    function registerCharity(
        string memory name,
        string memory description,
        address wallet
    ) external onlyAdmin {
        require(wallet != address(0), "Invalid address");
        require(!charities[wallet].verified, "Charity already registered");

        charities[wallet] = Charity(name, description, wallet, 0, 0, true);
    }

    function makeDonation(address charity) external payable {
        require(charities[charity].verified, "Charity not verified");
        require(msg.value > 0, "Donation amount must be positive");

        Donor storage donor = donors[msg.sender];
        donor.totalDonated += msg.value;
        donor.lastDonation = block.timestamp;

        // Avoid pushing duplicate charities
        bool alreadySupported = false;
        for (uint i = 0; i < donor.supportedCharities.length; i++) {
            if (donor.supportedCharities[i] == charity) {
                alreadySupported = true;
                break;
            }
        }
        if (!alreadySupported) {
            donor.supportedCharities.push(charity);
        }

        charities[charity].totalReceived += msg.value;

        emit DonationMade(msg.sender, charity, msg.value, false);

        (bool sent, ) = charity.call{value: msg.value}("");
        require(sent, "Failed to send donation");
    }

    function createSubscription(
        address charity,
        uint256 amount,
        uint256 interval
    ) external payable {
        require(charities[charity].verified, "Charity not verified");
        require(amount > 0, "Amount must be greater than 0");
        require(interval > 0, "Interval must be greater than 0");
        require(msg.value >= amount, "Insufficient funds for first payment");

        subscriptions[msg.sender].push(
            Subscription(charity, amount, interval, block.timestamp + interval)
        );

        emit DonationMade(msg.sender, charity, amount, true);

        (bool sent, ) = charity.call{value: amount}("");
        require(sent, "Failed to send initial subscription payment");
    }

    function executeSubscriptions() external {
        Subscription[] storage userSubs = subscriptions[msg.sender];

        for (uint i = 0; i < userSubs.length; i++) {
            if (block.timestamp >= userSubs[i].nextPayment) {
                (bool sent, ) = userSubs[i].charity.call{value: userSubs[i].amount}("");
                if (sent) {
                    userSubs[i].nextPayment += userSubs[i].interval;
                    emit DonationMade(msg.sender, userSubs[i].charity, userSubs[i].amount, true);
                }
            }
        }
    }

    function getDonorInfo(address donor) external view returns (Donor memory) {
        return donors[donor];
    }

    function getCharityInfo(address charity) external view returns (Charity memory) {
        return charities[charity];
    }

    function getSubscriptions(address donor) external view returns (Subscription[] memory) {
        return subscriptions[donor];
    }

    function withdrawFunds(uint256 amount) external {
        Charity storage c = charities[msg.sender];
        require(c.verified, "Not a verified charity");
        require(address(this).balance >= amount, "Insufficient contract balance");
        require(c.totalReceived >= amount, "Cannot withdraw more than received");

        c.lastWithdrawal = block.timestamp;
        c.totalReceived -= amount;

        (bool sent, ) = msg.sender.call{value: amount}("");
        require(sent, "Withdrawal failed");

        emit FundsWithdrawn(msg.sender, amount);
    }

    function getCharityDonations(address charity) external view returns (uint256) {
        return charities[charity].totalReceived;
    }

    event DonationMade(
        address indexed donor,
        address indexed charity,
        uint256 amount,
        bool isSubscription
    );

    event FundsWithdrawn(address indexed charity, uint256 amount);
}
