// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router02.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "./Safe.sol";

contract BotEntrypoint is AccessControl, Safe {
  address public dexRouter;
  address public wETH;
  uint256 public inversionQuantity = 0.001 ether;

  bytes32 public BOT_ROLE = keccak256("BOT_ROLE");

  event TokensBought(
    address token,
    uint256 wETHQuantityExpended,
    uint256 tokenQuantityObtained
  );
  event TokensSold(
    address token,
    uint256 tokenQuantityExpended,
    uint256 wETHQuantityObtained
  );
  event WethRedeemed(uint256 quantity);

  modifier onlyBotOrMe() {
    require(
      hasRole(BOT_ROLE, msg.sender) || msg.sender == address(this),
      "BotEntrypoint: ONLY BOT OR ME"
    );
    _;
  }

  constructor(address _dexRouter, address _wETH, uint256 _inversionQuantity) {
    dexRouter = _dexRouter;
    wETH = _wETH;
    inversionQuantity = _inversionQuantity;

    IERC20(wETH).approve(_dexRouter, type(uint256).max);

    _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
  }

  function buyEntryPointBot(address token) external onlyRole(BOT_ROLE) {
    require(
      IERC20(token).balanceOf(address(this)) == 0,
      "BotEntrypoint: ALREADY HAVE TOKENS"
    );

    address[] memory path = new address[](2);
    path[0] = wETH;
    path[1] = token;

    IUniswapV2Router02(dexRouter).swapExactTokensForTokens(
      inversionQuantity,
      0,
      path,
      address(this),
      block.timestamp + 120
    );

    (bool success, bytes memory data) = address(this).call(
      abi.encodeWithSignature("canSell(address)", token)
    );

    string memory revertMessage = getRevertMsg(data);
    string memory successRevertMessage = "YES";

    require(
      compareStrings(revertMessage, successRevertMessage),
      "BotEntrypoint: FAILING TRYING TO SELL"
    );

    emit TokensBought(
      token,
      inversionQuantity,
      IERC20(token).balanceOf(address(this))
    );
  }

  function sellEntryPointBot(address token) public onlyBotOrMe {
    address[] memory path = new address[](2);
    path[0] = token;
    path[1] = wETH;

    IERC20(token).approve(dexRouter, type(uint256).max);

    IUniswapV2Router02(dexRouter).swapExactTokensForTokens(
      IERC20(token).balanceOf(address(this)),
      0,
      path,
      address(this),
      block.timestamp + 120
    );
  }

  function canSell(address token) external {
    uint256 quantityOfWETH = IERC20(wETH).balanceOf(address(this));

    sellEntryPointBot(token);

    uint256 quantityOfTokenAfter = IERC20(token).balanceOf(address(this));
    uint256 quantityOfWETHAfter = IERC20(wETH).balanceOf(address(this));

    if (quantityOfTokenAfter != 0 || quantityOfWETHAfter == quantityOfWETH) {
      revert("NO");
    }
    revert("YES");
  }

  function redeemWETH(uint256 quantity) external onlyRole(DEFAULT_ADMIN_ROLE) {
    IERC20(wETH).transfer(msg.sender, quantity);
  }

  function setInversionQuantity(
    uint256 _inversionQuantity
  ) external onlyRole(DEFAULT_ADMIN_ROLE) {
    inversionQuantity = _inversionQuantity;
  }

  function withdrawFunds(address target) external onlyRole(DEFAULT_ADMIN_ROLE) {
    _withdrawFunds(target);
  }

  function withdrawFundsERC20(
    address target,
    address tokenAddress
  ) external onlyRole(DEFAULT_ADMIN_ROLE) {
    _withdrawFundsERC20(target, tokenAddress);
  }

  // https://ethereum.stackexchange.com/a/83577
  // https://github.com/Uniswap/v3-periphery/blob/v1.0.0/contracts/base/Multicall.sol
  function getRevertMsg(
    bytes memory returnData
  ) internal pure returns (string memory) {
    // If the _res length is less than 68, then the transaction failed silently (without a revert message)
    if (returnData.length < 68) return "SUBSCRIBED_CONTRACT: REVERT_SILENTLY";
    assembly {
      // Slice the sighash.
      returnData := add(returnData, 0x04)
    }
    return abi.decode(returnData, (string)); // All that remains is the revert string
  }

  function compareStrings(
    string memory a,
    string memory b
  ) internal pure returns (bool) {
    return (keccak256(abi.encodePacked((a))) ==
      keccak256(abi.encodePacked((b))));
  }

  function shouldShell(address token) external view returns (bool) {
    address[] memory path = new address[](2);
    path[0] = token;
    path[1] = wETH;

    uint256 amountIn = IERC20(token).balanceOf(address(this));

    uint256[] memory amounts = IUniswapV2Router02(dexRouter).getAmountsOut(
      amountIn,
      path
    );

    return amounts[1] > inversionQuantity * 2;
  }
}
